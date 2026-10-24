"""
Tests for forecast eligibility selection logic and cutoff enforcement.
"""

import pytest
from backend.app.services.forecast_selector import forecast_selector


def test_forecast_selector_selects_latest_eligible_before_cutoff():
    # Delivery target: 2026-01-02T14:00:00Z (Decision Date = 2026-01-01)
    # Cutoff: 11:00 London time on 2026-01-01 -> 2026-01-01T11:00:00Z
    records = [
        # Published well before cutoff
        {
            "startTime": "2026-01-02T14:00:00Z",
            "publishTime": "2026-01-01T06:00:00Z",
            "generation": 10000
        },
        # Published closer to cutoff (latest eligible)
        {
            "startTime": "2026-01-02T14:00:00Z",
            "publishTime": "2026-01-01T10:30:00Z",
            "generation": 12500
        },
        # Published AFTER cutoff (should be excluded!)
        {
            "startTime": "2026-01-02T14:00:00Z",
            "publishTime": "2026-01-01T14:00:00Z",
            "generation": 14000
        }
    ]

    selected = forecast_selector.select_eligible_forecasts(records, cutoff_time_str="11:00")
    assert "2026-01-02T14:00:00Z" in selected
    res = selected["2026-01-02T14:00:00Z"]
    assert res["generation"] == 12500
    assert res["publishTime"] == "2026-01-01T10:30:00Z"
    assert res["eligibleCandidatesCount"] == 2
    assert res["totalCandidatesCount"] == 3


def test_forecast_selector_exact_cutoff_boundary():
    # Record published EXACTLY at 11:00:00Z must be eligible (publish <= cutoff)
    records = [
        {
            "startTime": "2026-01-02T08:00:00Z",
            "publishTime": "2026-01-01T11:00:00Z",
            "generation": 8800
        },
        {
            "startTime": "2026-01-02T08:00:00Z",
            "publishTime": "2026-01-01T11:00:01Z",  # 1 second after cutoff -> rejected!
            "generation": 9900
        }
    ]

    selected = forecast_selector.select_eligible_forecasts(records, cutoff_time_str="11:00")
    res = selected["2026-01-02T08:00:00Z"]
    assert res["generation"] == 8800
    assert res["publishTime"] == "2026-01-01T11:00:00Z"


def test_forecast_selector_all_published_after_cutoff():
    # If all forecasts for this interval were published after cutoff, interval has no eligible forecast
    records = [
        {
            "startTime": "2026-01-02T12:00:00Z",
            "publishTime": "2026-01-01T15:00:00Z",
            "generation": 5000
        }
    ]
    selected = forecast_selector.select_eligible_forecasts(records, cutoff_time_str="11:00")
    assert "2026-01-02T12:00:00Z" not in selected


def test_forecast_selector_deterministic_duplicate_handling():
    # Two records with identical startTime and publishTime
    records = [
        {
            "startTime": "2026-01-02T16:00:00Z",
            "publishTime": "2026-01-01T09:00:00Z",
            "generation": 7000
        },
        {
            "startTime": "2026-01-02T16:00:00Z",
            "publishTime": "2026-01-01T09:00:00Z",
            "generation": 7000
        }
    ]
    selected = forecast_selector.select_eligible_forecasts(records, cutoff_time_str="11:00")
    assert "2026-01-02T16:00:00Z" in selected
    assert selected["2026-01-02T16:00:00Z"]["generation"] == 7000
