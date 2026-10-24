"""
Forecast Accuracy Analysis Module
Statistical error measures (MAE, RMSE, Bias, Coverage, Error Distributions, Outliers)
for evaluated day-ahead wind generation forecasts against actual generation.
"""

import math
from typing import List, Dict, Any, Optional


class AccuracyMetricsCalculator:
    """
    Computes rigorous statistical forecast accuracy metrics on paired delivery intervals.
    """

    @staticmethod
    def calculate_metrics(aligned_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates comprehensive summary statistics from aligned interval records.
        Only intervals with status == 'MATCHED' are included in forecast error formulas.
        """
        total_expected = len(aligned_records)
        matched_records = [r for r in aligned_records if r["status"] == "MATCHED"]
        missing_forecast_records = [r for r in aligned_records if r["status"] == "MISSING_FORECAST"]
        missing_actual_records = [r for r in aligned_records if r["status"] == "MISSING_ACTUAL"]
        missing_both_records = [r for r in aligned_records if r["status"] == "MISSING_BOTH"]

        matched_count = len(matched_records)
        missing_forecast_count = len(missing_forecast_records)
        missing_actual_count = len(missing_actual_records)
        missing_both_count = len(missing_both_records)

        coverage_percentage = round((matched_count / total_expected * 100), 2) if total_expected > 0 else 0.0

        if matched_count == 0:
            return {
                "totalExpectedIntervals": total_expected,
                "matchedIntervals": 0,
                "missingForecastCount": missing_forecast_count,
                "missingActualCount": missing_actual_count,
                "missingBothCount": missing_both_count,
                "forecastCoveragePercent": coverage_percentage,
                "mae": None,
                "rmse": None,
                "bias": None,
                "mape": None,
                "avgForecastMw": None,
                "avgActualMw": None,
                "maxForecastMw": None,
                "maxActualMw": None,
                "maxAbsoluteErrorMw": None,
                "unit": "MW",
                "errorDistribution": [],
                "largestErrorIntervals": []
            }

        forecast_vals = [r["forecastGeneration"] for r in matched_records]
        actual_vals = [r["actualGeneration"] for r in matched_records]
        signed_errors = [r["signedError"] for r in matched_records]
        abs_errors = [r["absoluteError"] for r in matched_records]
        sq_errors = [r["squaredError"] for r in matched_records]

        # Mean Absolute Error (MAE)
        mae = round(sum(abs_errors) / matched_count, 2)

        # Root Mean Squared Error (RMSE)
        rmse = round(math.sqrt(sum(sq_errors) / matched_count), 2)

        # Mean Forecast Bias (signed error average)
        bias = round(sum(signed_errors) / matched_count, 2)

        # Averages
        avg_forecast = round(sum(forecast_vals) / matched_count, 2)
        avg_actual = round(sum(actual_vals) / matched_count, 2)
        max_forecast = round(max(forecast_vals), 2)
        max_actual = round(max(actual_vals), 2)
        max_abs_error = round(max(abs_errors), 2)

        # Safe MAPE: Exclude near-zero actual generation (< 50 MW) to avoid division distortion
        valid_mape_pairs = [
            (r["absoluteError"] / r["actualGeneration"]) * 100
            for r in matched_records
            if r["actualGeneration"] is not None and r["actualGeneration"] >= 50.0
        ]
        mape = round(sum(valid_mape_pairs) / len(valid_mape_pairs), 2) if valid_mape_pairs else None

        # Error distribution buckets (MW)
        # Bins: Strongly Under (-3000+), Mod Under (-3000 to -1000), Slight Under (-1000 to 0),
        # Slight Over (0 to 1000), Mod Over (1000 to 3000), Strongly Over (3000+)
        bins = [
            {"range": "< -3000 MW", "min": -99999, "max": -3000, "count": 0, "type": "underforecast"},
            {"range": "-3000 to -1000 MW", "min": -3000, "max": -1000, "count": 0, "type": "underforecast"},
            {"range": "-1000 to 0 MW", "min": -1000, "max": 0, "count": 0, "type": "underforecast"},
            {"range": "0 to +1000 MW", "min": 0, "max": 1000, "count": 0, "type": "overforecast"},
            {"range": "+1000 to +3000 MW", "min": 1000, "max": 3000, "count": 0, "type": "overforecast"},
            {"range": "> +3000 MW", "min": 3000, "max": 99999, "count": 0, "type": "overforecast"},
        ]

        for err in signed_errors:
            for b in bins:
                if b["min"] <= err < b["max"] or (b["max"] >= 99999 and err >= 3000):
                    b["count"] += 1
                    break

        # Top 10 largest absolute error outlier intervals
        sorted_by_abs_err = sorted(matched_records, key=lambda x: x["absoluteError"], reverse=True)
        largest_errors = [
            {
                "deliveryInterval": r["deliveryInterval"],
                "deliveryIntervalLocal": r["deliveryIntervalLocal"],
                "settlementPeriod": r["settlementPeriod"],
                "forecastGeneration": r["forecastGeneration"],
                "actualGeneration": r["actualGeneration"],
                "signedError": r["signedError"],
                "absoluteError": r["absoluteError"],
                "publishTime": r["publishTime"],
                "impact": "OVERFORECAST_SURPLUS_RISK" if r["signedError"] > 0 else "UNDERFORECAST_DEFICIT_RISK"
            }
            for r in sorted_by_abs_err[:10]
        ]

        return {
            "totalExpectedIntervals": total_expected,
            "matchedIntervals": matched_count,
            "missingForecastCount": missing_forecast_count,
            "missingActualCount": missing_actual_count,
            "missingBothCount": missing_both_count,
            "forecastCoveragePercent": coverage_percentage,
            "mae": mae,
            "rmse": rmse,
            "bias": bias,
            "mape": mape,
            "avgForecastMw": avg_forecast,
            "avgActualMw": avg_actual,
            "maxForecastMw": max_forecast,
            "maxActualMw": max_actual,
            "maxAbsoluteErrorMw": max_abs_error,
            "unit": "MW",
            "errorDistribution": bins,
            "largestErrorIntervals": largest_errors
        }


metrics_calculator = AccuracyMetricsCalculator()
