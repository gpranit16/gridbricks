"""
Analytics Pipeline Coordinator
Orchestrates data retrieval from Elexon client/cache, forecast eligibility selection,
interval alignment, and statistical analysis.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta, timezone
from backend.app.config import settings
from backend.app.clients.elexon import elexon_client
from backend.app.services.forecast_selector import forecast_selector
from backend.app.services.alignment import alignment_service
from backend.app.analysis.metrics import metrics_calculator
from backend.app.services.procurement import procurement_service
from backend.app.services.time_utils import (
    get_delivery_date_for_decision,
    format_iso_utc,
    parse_iso_datetime
)
from backend.app.db.mongo import mongo_service

logger = logging.getLogger(__name__)


class AnalyticsPipeline:
    def __init__(self):
        self._last_sync_time: Optional[datetime] = None

    def execute_pipeline(
        self,
        decision_start_date: str = "2026-01-01",
        decision_end_date: str = "2026-01-31",
        cutoff_time_str: str = "11:00",
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Executes end-to-end analytical pipeline for specified decision date range and cutoff.
        """
        # Validate dates
        try:
            d_start = date.fromisoformat(decision_start_date)
            d_end = date.fromisoformat(decision_end_date)
        except ValueError as e:
            raise ValueError(f"Invalid date format: {e}. Expected YYYY-MM-DD.")

        if d_start > d_end:
            raise ValueError(f"Start date ({decision_start_date}) cannot be after end date ({decision_end_date})")

        # Cache key based on input parameters
        cache_key = f"pipeline:{decision_start_date}:{decision_end_date}:{cutoff_time_str}"
        
        if not force_refresh:
            cached_result = mongo_service.get_analytics_cache(cache_key)
            if cached_result:
                logger.info("Serving pipeline result from cache for %s", cache_key)
                return cached_result

        # Delivery range covers (start + 1 day) to (end + 1 day)
        start_delivery = get_delivery_date_for_decision(d_start)
        end_delivery = get_delivery_date_for_decision(d_end)

        # 1. Fetch Actuals from FUELHH (fuelType == 'WIND')
        actual_records = elexon_client.fetch_actual_wind_generation(
            settlement_date_from=start_delivery.isoformat(),
            settlement_date_to=end_delivery.isoformat(),
            use_cache=not force_refresh
        )

        # 2. Fetch Forecasts from WINDFOR
        # Forecasts for decision dates starting d_start with cutoff 11:00 London time
        # were published starting before d_start (e.g. d_start - 2 days) up to the cutoff of d_end (d_end 23:59:59)
        publish_from = f"{(d_start - timedelta(days=2)).isoformat()}T00:00:00Z"
        publish_to = f"{d_end.isoformat()}T23:59:59Z"

        forecast_records = elexon_client.fetch_wind_forecasts(
            publish_time_from=publish_from,
            publish_time_to=publish_to,
            use_cache=not force_refresh
        )

        # 3. Select Eligible Forecasts (cutoff filter & latest publication selection)
        selected_forecasts = forecast_selector.select_eligible_forecasts(
            forecast_records=forecast_records,
            cutoff_time_str=cutoff_time_str
        )

        # 4. Align Half-Hourly Intervals
        aligned_records = alignment_service.align_intervals(
            decision_start_date=d_start,
            decision_end_date=d_end,
            selected_forecasts=selected_forecasts,
            actual_records=actual_records,
            cutoff_time_str=cutoff_time_str
        )

        # 5. Calculate Metrics
        summary_metrics = metrics_calculator.calculate_metrics(aligned_records)

        # 6. Generate Procurement Context
        proc_context = procurement_service.generate_procurement_context(
            summary_metrics=summary_metrics,
            aligned_records=aligned_records
        )

        # Find latest eligible forecast publication time within the dataset
        latest_publish_time = None
        published_times = [
            r["publishTime"] for r in aligned_records if r.get("publishTime") is not None
        ]
        if published_times:
            latest_publish_time = max(published_times)

        result = {
            "decisionPeriod": {
                "startDate": decision_start_date,
                "endDate": decision_end_date
            },
            "deliveryPeriod": {
                "startDate": start_delivery.isoformat(),
                "endDate": end_delivery.isoformat()
            },
            "decisionCutoffTime": cutoff_time_str,
            "latestForecastPublishTime": latest_publish_time,
            "metrics": summary_metrics,
            "procurementContext": proc_context,
            "alignedRecords": aligned_records,
            "dataFreshness": {
                "lastSyncTime": datetime.now(timezone.utc).isoformat(),
                "dataSourceActuals": "Elexon BMRS FUELHH Stream (fuelType=WIND)",
                "dataSourceForecasts": "Elexon BMRS WINDFOR Stream",
                "storageEngine": "MongoDB Atlas" if mongo_service.is_connected() else "Local Resilient Storage"
            },
            "metadata": {
                "timezone": "Europe/London",
                "gateClosureRationale": (
                    f"Assumed day-ahead market order book gate closure cutoff at {cutoff_time_str} London time. "
                    "Forecasts published strictly on or before this time are considered eligible."
                )
            }
        }

        # Cache result
        mongo_service.set_analytics_cache(cache_key, result)
        self._last_sync_time = datetime.now(timezone.utc)

        return result


pipeline_coordinator = AnalyticsPipeline()
