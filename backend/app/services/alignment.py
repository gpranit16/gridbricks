"""
Data Alignment Service
Aligns half-hourly delivery intervals between eligible day-ahead wind forecasts and actual generation.
Handles missing records, status tracking, and error metrics calculation per interval.
"""

import logging
from typing import List, Dict, Any, Tuple
from datetime import date, datetime
from backend.app.services.time_utils import (
    generate_expected_half_hour_intervals,
    format_iso_utc,
    format_uk_local,
    parse_iso_datetime,
    get_delivery_date_for_decision,
    get_decision_date_for_delivery,
    get_decision_cutoff_utc
)

logger = logging.getLogger(__name__)


class DataAlignmentService:
    @staticmethod
    def align_intervals(
        decision_start_date: date,
        decision_end_date: date,
        selected_forecasts: Dict[str, Dict[str, Any]],
        actual_records: List[Dict[str, Any]],
        cutoff_time_str: str = "11:00"
    ) -> List[Dict[str, Any]]:
        """
        Generates full aligned timeline across the delivery period corresponding to
        the decision date range.
        
        Decision range: [decision_start_date, decision_end_date]
        Delivery range: [decision_start_date + 1 day, decision_end_date + 1 day]
        """
        start_delivery = get_delivery_date_for_decision(decision_start_date)
        end_delivery = get_delivery_date_for_decision(decision_end_date)
        
        expected_intervals = generate_expected_half_hour_intervals(start_delivery, end_delivery)
        
        # Index actuals by standardized startTime UTC
        actual_map: Dict[str, Dict[str, Any]] = {}
        for r in actual_records:
            st = r.get("startTime")
            if st:
                try:
                    norm_st = format_iso_utc(parse_iso_datetime(st))
                    actual_map[norm_st] = r
                except Exception:
                    continue
                    
        aligned_rows: List[Dict[str, Any]] = []
        
        for dt_utc in expected_intervals:
            start_iso = format_iso_utc(dt_utc)
            start_local = format_uk_local(dt_utc)
            
            delivery_date = dt_utc.date()
            decision_date = get_decision_date_for_delivery(delivery_date)
            cutoff_dt_utc = get_decision_cutoff_utc(decision_date, cutoff_time_str)
            cutoff_iso = format_iso_utc(cutoff_dt_utc)
            
            forecast_item = selected_forecasts.get(start_iso)
            actual_item = actual_map.get(start_iso)
            
            forecast_val = forecast_item["generation"] if forecast_item else None
            actual_val = float(actual_item["generation"]) if actual_item and actual_item.get("generation") is not None else None
            publish_time_iso = forecast_item["publishTime"] if forecast_item else None
            
            # Settlement period calculation (1 to 48 standard)
            # In UK market, 00:00 is SP 1, 00:30 is SP 2, etc.
            minute_of_day = dt_utc.hour * 60 + dt_utc.minute
            settlement_period = (minute_of_day // 30) + 1
            
            status = "MATCHED"
            signed_error = None
            abs_error = None
            squared_error = None
            percentage_error = None
            
            if forecast_val is not None and actual_val is not None:
                status = "MATCHED"
                signed_error = round(forecast_val - actual_val, 2)
                abs_error = round(abs(signed_error), 2)
                squared_error = round(signed_error ** 2, 2)
                if actual_val > 0:
                    percentage_error = round((abs_error / actual_val) * 100, 2)
            elif forecast_val is None and actual_val is not None:
                status = "MISSING_FORECAST"
            elif forecast_val is not None and actual_val is None:
                status = "MISSING_ACTUAL"
            else:
                status = "MISSING_BOTH"
                
            aligned_rows.append({
                "deliveryInterval": start_iso,
                "deliveryIntervalLocal": start_local,
                "decisionDate": decision_date.isoformat(),
                "deliveryDate": delivery_date.isoformat(),
                "decisionCutoffUtc": cutoff_iso,
                "settlementPeriod": settlement_period,
                "publishTime": publish_time_iso,
                "forecastGeneration": round(forecast_val, 2) if forecast_val is not None else None,
                "actualGeneration": round(actual_val, 2) if actual_val is not None else None,
                "signedError": signed_error,
                "absoluteError": abs_error,
                "squaredError": squared_error,
                "percentageError": percentage_error,
                "status": status,
                "unit": "MW"
            })
            
        return aligned_rows


alignment_service = DataAlignmentService()
