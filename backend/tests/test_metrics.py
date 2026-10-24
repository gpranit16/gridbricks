"""
Tests for statistical accuracy metric calculations with hand-checkable examples.
"""

import math
import pytest
from backend.app.analysis.metrics import metrics_calculator


def test_hand_checkable_metrics():
    # 4 hand-checkable test intervals
    # Interval 1: Forecast = 1000, Actual = 800  -> Error = +200, AbsError = 200, SqError = 40000
    # Interval 2: Forecast = 1500, Actual = 1600 -> Error = -100, AbsError = 100, SqError = 10000
    # Interval 3: Forecast = 2000, Actual = 2000 -> Error = 0,    AbsError = 0,   SqError = 0
    # Interval 4: Forecast = 500,  Actual = 800  -> Error = -300, AbsError = 300, SqError = 90000
    #
    # MAE = (200 + 100 + 0 + 300) / 4 = 600 / 4 = 150.0
    # Bias = (200 - 100 + 0 - 300) / 4 = -200 / 4 = -50.0
    # RMSE = sqrt((40000 + 10000 + 0 + 90000) / 4) = sqrt(140000 / 4) = sqrt(35000) ≈ 187.08
    aligned_data = [
        {
            "deliveryInterval": "2026-01-02T00:00:00Z",
            "deliveryIntervalLocal": "2026-01-02 00:00 GMT",
            "settlementPeriod": 1,
            "forecastGeneration": 1000.0,
            "actualGeneration": 800.0,
            "signedError": 200.0,
            "absoluteError": 200.0,
            "squaredError": 40000.0,
            "publishTime": "2026-01-01T10:00:00Z",
            "status": "MATCHED"
        },
        {
            "deliveryInterval": "2026-01-02T00:30:00Z",
            "deliveryIntervalLocal": "2026-01-02 00:30 GMT",
            "settlementPeriod": 2,
            "forecastGeneration": 1500.0,
            "actualGeneration": 1600.0,
            "signedError": -100.0,
            "absoluteError": 100.0,
            "squaredError": 10000.0,
            "publishTime": "2026-01-01T10:00:00Z",
            "status": "MATCHED"
        },
        {
            "deliveryInterval": "2026-01-02T01:00:00Z",
            "deliveryIntervalLocal": "2026-01-02 01:00 GMT",
            "settlementPeriod": 3,
            "forecastGeneration": 2000.0,
            "actualGeneration": 2000.0,
            "signedError": 0.0,
            "absoluteError": 0.0,
            "squaredError": 0.0,
            "publishTime": "2026-01-01T10:00:00Z",
            "status": "MATCHED"
        },
        {
            "deliveryInterval": "2026-01-02T01:30:00Z",
            "deliveryIntervalLocal": "2026-01-02 01:30 GMT",
            "settlementPeriod": 4,
            "forecastGeneration": 500.0,
            "actualGeneration": 800.0,
            "signedError": -300.0,
            "absoluteError": 300.0,
            "squaredError": 90000.0,
            "publishTime": "2026-01-01T10:00:00Z",
            "status": "MATCHED"
        },
        # 1 Missing forecast interval
        {
            "deliveryInterval": "2026-01-02T02:00:00Z",
            "deliveryIntervalLocal": "2026-01-02 02:00 GMT",
            "settlementPeriod": 5,
            "forecastGeneration": None,
            "actualGeneration": 900.0,
            "signedError": None,
            "absoluteError": None,
            "squaredError": None,
            "publishTime": None,
            "status": "MISSING_FORECAST"
        }
    ]

    metrics = metrics_calculator.calculate_metrics(aligned_data)

    assert metrics["totalExpectedIntervals"] == 5
    assert metrics["matchedIntervals"] == 4
    assert metrics["missingForecastCount"] == 1
    assert metrics["forecastCoveragePercent"] == 80.0
    assert metrics["mae"] == 150.0
    assert metrics["bias"] == -50.0
    assert math.isclose(metrics["rmse"], 187.08, abs_tol=0.01)
    assert metrics["avgForecastMw"] == (1000 + 1500 + 2000 + 500) / 4
    assert metrics["avgActualMw"] == (800 + 1600 + 2000 + 800) / 4


def test_empty_aligned_records():
    metrics = metrics_calculator.calculate_metrics([])
    assert metrics["totalExpectedIntervals"] == 0
    assert metrics["matchedIntervals"] == 0
    assert metrics["mae"] is None
    assert metrics["rmse"] is None
    assert metrics["forecastCoveragePercent"] == 0.0
