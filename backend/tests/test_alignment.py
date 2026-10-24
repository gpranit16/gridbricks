"""
Tests for interval alignment between forecast and actual generation.
"""

from datetime import date
import pytest
from backend.app.services.alignment import alignment_service


def test_align_intervals_matching():
    decision_start = date(2026, 1, 1)
    decision_end = date(2026, 1, 1)  # 1 day decision -> 1 day delivery: 2026-01-02

    selected_forecasts = {
        "2026-01-02T00:00:00Z": {
            "startTime": "2026-01-02T00:00:00Z",
            "publishTime": "2026-01-01T10:00:00Z",
            "generation": 11500.0
        }
    }

    actual_records = [
        {
            "startTime": "2026-01-02T00:00:00Z",
            "fuelType": "WIND",
            "generation": 12000.0
        },
        {
            "startTime": "2026-01-02T00:30:00Z",
            "fuelType": "WIND",
            "generation": 12200.0
        }
    ]

    aligned = alignment_service.align_intervals(
        decision_start_date=decision_start,
        decision_end_date=decision_end,
        selected_forecasts=selected_forecasts,
        actual_records=actual_records,
        cutoff_time_str="11:00"
    )

    # 1 delivery day = 48 intervals
    assert len(aligned) == 48

    # First interval should be MATCHED
    first = aligned[0]
    assert first["deliveryInterval"] == "2026-01-02T00:00:00Z"
    assert first["status"] == "MATCHED"
    assert first["forecastGeneration"] == 11500.0
    assert first["actualGeneration"] == 12000.0
    assert first["signedError"] == -500.0
    assert first["absoluteError"] == 500.0

    # Second interval has actual but no forecast -> MISSING_FORECAST
    second = aligned[1]
    assert second["deliveryInterval"] == "2026-01-02T00:30:00Z"
    assert second["status"] == "MISSING_FORECAST"
    assert second["actualGeneration"] == 12200.0
    assert second["forecastGeneration"] is None
    assert second["signedError"] is None
