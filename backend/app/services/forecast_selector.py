"""
Historical Day-Ahead Forecast Selection Logic
Reconstructs the exact wind generation forecast available to wholesale traders
at the decision cutoff time on Day D for delivery on Day D+1.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.services.time_utils import (
    parse_iso_datetime,
    format_iso_utc,
    get_decision_date_for_delivery,
    get_decision_cutoff_utc,
    UTC_TZ
)

logger = logging.getLogger(__name__)


class ForecastSelector:
    """
    Selects the latest eligible forecast for each delivery interval,
    strictly respecting the day-ahead purchasing gate closure cutoff.
    """

    @staticmethod
    def select_eligible_forecasts(
        forecast_records: List[Dict[str, Any]],
        cutoff_time_str: str = "11:00"
    ) -> Dict[str, Dict[str, Any]]:
        """
        Processes raw WINDFOR records and selects the latest eligible forecast
        for each target interval (identified by startTime in UTC).
        
        Returns:
            Dictionary mapping normalized interval startTime UTC string -> selected forecast record.
        """
        # Group forecasts by delivery interval startTime
        grouped_by_interval: Dict[str, List[Dict[str, Any]]] = {}
        
        for record in forecast_records:
            raw_start = record.get("startTime")
            raw_publish = record.get("publishTime")
            gen = record.get("generation")
            
            if not raw_start or not raw_publish or gen is None:
                continue
                
            try:
                start_dt = parse_iso_datetime(raw_start)
                publish_dt = parse_iso_datetime(raw_publish)
                start_iso = format_iso_utc(start_dt)
                publish_iso = format_iso_utc(publish_dt)
            except Exception as e:
                logger.debug("Skipping malformed forecast record (%s): %s", e, record)
                continue
                
            if start_iso not in grouped_by_interval:
                grouped_by_interval[start_iso] = []
                
            grouped_by_interval[start_iso].append({
                "start_dt": start_dt,
                "publish_dt": publish_dt,
                "start_iso": start_iso,
                "publish_iso": publish_iso,
                "generation": float(gen),
                "raw": record
            })
            
        selected_forecasts: Dict[str, Dict[str, Any]] = {}
        
        for start_iso, candidates in grouped_by_interval.items():
            first_candidate = candidates[0]
            start_dt = first_candidate["start_dt"]
            
            # UK Day-Ahead logic: delivery date is target start date in London time
            # Purchasing decision was made on D = Delivery Date - 1 day
            delivery_date = start_dt.date()
            decision_date = get_decision_date_for_delivery(delivery_date)
            
            # Compute exact cutoff timestamp in UTC
            cutoff_dt_utc = get_decision_cutoff_utc(decision_date, cutoff_time_str)
            
            # Filter candidates published on or before the cutoff (publish_dt <= cutoff_dt_utc)
            eligible_candidates = [
                c for c in candidates
                if c["publish_dt"] <= cutoff_dt_utc
            ]
            
            if not eligible_candidates:
                # No forecast was published before gate closure
                continue
                
            # Deterministic sorting:
            # 1. Latest publish_dt descending
            # 2. In case of identical publish_dt (duplicate publication), sort by generation deterministically
            eligible_candidates.sort(key=lambda x: (x["publish_dt"], x["generation"]), reverse=True)
            
            best_candidate = eligible_candidates[0]
            
            selected_forecasts[start_iso] = {
                "startTime": start_iso,
                "publishTime": best_candidate["publish_iso"],
                "decisionDate": decision_date.isoformat(),
                "cutoffUtc": format_iso_utc(cutoff_dt_utc),
                "generation": best_candidate["generation"],
                "eligibleCandidatesCount": len(eligible_candidates),
                "totalCandidatesCount": len(candidates)
            }
            
        return selected_forecasts


forecast_selector = ForecastSelector()
