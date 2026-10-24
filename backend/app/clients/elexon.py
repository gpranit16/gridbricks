"""
Elexon BMRS API Client
Dedicated client for retrieving actual wind generation (FUELHH stream)
and wind forecasts (WINDFOR stream) with retries, timeouts, and validation.
"""

import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import httpx
from backend.app.config import settings
from backend.app.db.mongo import mongo_service

logger = logging.getLogger(__name__)


class ElexonAPIError(Exception):
    """Raised when Elexon BMRS API requests fail."""
    pass


class ElexonClient:
    def __init__(self, base_url: Optional[str] = None, timeout: Optional[int] = None):
        self.base_url = (base_url or settings.ELEXON_BASE_URL).rstrip("/")
        self.timeout = timeout or settings.ELEXON_TIMEOUT_SECONDS
        self.max_retries = settings.ELEXON_MAX_RETRIES
        self.last_retrieval_time: Optional[datetime] = None

    def _request_with_retry(self, endpoint: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Executes HTTP GET request against Elexon BMRS API with exponential backoff.
        """
        url = f"{self.base_url}{endpoint}"
        headers = {
            "User-Agent": "UK-Wind-Forecast-Analytics/1.0 (Energy Procurement Research)",
            "Accept": "application/json"
        }
        
        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.get(url, params=params, headers=headers)
                    
                    if response.status_code == 200:
                        self.last_retrieval_time = datetime.now(timezone.utc)
                        raw_data = response.json()
                        # Handle array response or {data: [...]} response
                        if isinstance(raw_data, list):
                            return raw_data
                        elif isinstance(raw_data, dict) and "data" in raw_data:
                            return raw_data["data"]
                        else:
                            logger.warning("Unexpected response structure from %s: %s", url, type(raw_data))
                            return []
                    elif response.status_code == 429:
                        wait_sec = attempt * 2
                        logger.warning("Elexon rate limit (429) hit. Retrying in %ss (attempt %s/%s)...", wait_sec, attempt, self.max_retries)
                        time.sleep(wait_sec)
                        last_error = ElexonAPIError("Rate limit exceeded (HTTP 429)")
                    elif response.status_code >= 500:
                        wait_sec = attempt * 1.5
                        logger.warning("Elexon upstream server error %s. Retrying in %ss...", response.status_code, wait_sec)
                        time.sleep(wait_sec)
                        last_error = ElexonAPIError(f"Elexon server error: HTTP {response.status_code}")
                    else:
                        raise ElexonAPIError(f"Elexon API returned HTTP {response.status_code}: {response.text[:200]}")
            except (httpx.TimeoutException, httpx.NetworkError) as e:
                last_error = e
                wait_sec = attempt * 1.5
                logger.warning("Network issue connecting to Elexon (%s). Retrying in %ss...", str(e), wait_sec)
                time.sleep(wait_sec)

        raise ElexonAPIError(f"Failed to fetch data from Elexon after {self.max_retries} attempts: {last_error}")

    def fetch_actual_wind_generation(
        self,
        settlement_date_from: str,
        settlement_date_to: str,
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Fetches actual wind generation from FUELHH stream.
        Filters strictly for fuelType == 'WIND'.
        """
        # Convert date range to expected ISO start times for cache check
        start_iso = f"{settlement_date_from}T00:00:00Z"
        end_iso = f"{settlement_date_to}T23:59:59Z"

        if use_cache:
            cached = mongo_service.get_fuelhh_records(start_iso, end_iso)
            if cached and len(cached) >= 48:
                logger.info("Retrieved %s cached FUELHH records for %s to %s", len(cached), settlement_date_from, settlement_date_to)
                return cached

        # Fetch in daily or small chunks if range > 3 days to respect upstream stream limits
        records: List[Dict[str, Any]] = []
        try:
            from datetime import date
            dt_from = date.fromisoformat(settlement_date_from)
            dt_to = date.fromisoformat(settlement_date_to)
            
            cur = dt_from
            while cur <= dt_to:
                chunk_end = min(cur + timedelta(days=2), dt_to)
                params = {
                    "settlementDateFrom": cur.isoformat(),
                    "settlementDateTo": chunk_end.isoformat()
                }
                raw = self._request_with_retry("/datasets/FUELHH/stream", params)
                # Filter strictly for fuelType == 'WIND'
                wind_records = [
                    r for r in raw
                    if isinstance(r, dict)
                    and r.get("fuelType") == "WIND"
                    and r.get("startTime") is not None
                    and r.get("generation") is not None
                ]
                records.extend(wind_records)
                cur = chunk_end + timedelta(days=1)

        except Exception as e:
            logger.error("Error retrieving FUELHH records from Elexon: %s", str(e))
            # Try to return cached records even if incomplete
            cached = mongo_service.get_fuelhh_records(start_iso, end_iso)
            if cached:
                return cached
            raise

        # Save to MongoDB/fallback cache
        if records:
            mongo_service.save_fuelhh_records(records)

        return records

    def fetch_wind_forecasts(
        self,
        publish_time_from: str,
        publish_time_to: str,
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Fetches wind forecasts from WINDFOR stream using publishDateTimeFrom & publishDateTimeTo.
        Retains both publishTime and startTime for historical decision reconstruction.
        """
        if use_cache:
            cached = mongo_service.get_windfor_records(publish_time_from, publish_time_to)
            if cached and len(cached) >= 48:
                logger.info("Retrieved %s cached WINDFOR records for %s to %s", len(cached), publish_time_from, publish_time_to)
                return cached

        records: List[Dict[str, Any]] = []
        try:
            from dateutil.parser import parse as parse_date
            dt_from = parse_date(publish_time_from)
            dt_to = parse_date(publish_time_to)

            cur = dt_from
            while cur <= dt_to:
                chunk_end = min(cur + timedelta(days=2), dt_to)
                params = {
                    "publishDateTimeFrom": cur.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "publishDateTimeTo": chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
                }
                raw = self._request_with_retry("/datasets/WINDFOR/stream", params)
                valid_records = [
                    r for r in raw
                    if isinstance(r, dict)
                    and r.get("startTime") is not None
                    and r.get("publishTime") is not None
                    and r.get("generation") is not None
                ]
                records.extend(valid_records)
                cur = chunk_end + timedelta(seconds=1)

        except Exception as e:
            logger.error("Error retrieving WINDFOR records from Elexon: %s", str(e))
            cached = mongo_service.get_windfor_records(publish_time_from, publish_time_to)
            if cached:
                return cached
            raise

        if records:
            mongo_service.save_windfor_records(records)

        return records


elexon_client = ElexonClient()
