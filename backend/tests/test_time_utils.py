"""
Tests for time and date processing utilities.
"""

from datetime import date, datetime, timezone
import pytest
from backend.app.services.time_utils import (
    parse_iso_datetime,
    format_iso_utc,
    get_decision_cutoff_utc,
    get_delivery_date_for_decision,
    get_decision_date_for_delivery,
    generate_expected_half_hour_intervals
)


def test_parse_iso_datetime():
    dt_str = "2026-01-05T12:00:00Z"
    dt = parse_iso_datetime(dt_str)
    assert dt.year == 2026
    assert dt.month == 1
    assert dt.day == 5
    assert dt.hour == 12
    assert dt.tzinfo == timezone.utc


def test_get_decision_cutoff_utc_gmt():
    # In January, London is on GMT (UTC+0)
    decision_d = date(2026, 1, 15)
    cutoff_utc = get_decision_cutoff_utc(decision_d, "11:00")
    assert cutoff_utc.hour == 11
    assert cutoff_utc.minute == 0
    assert cutoff_utc.day == 15
    assert format_iso_utc(cutoff_utc) == "2026-01-15T11:00:00Z"


def test_get_delivery_date_for_decision():
    # Day D decision -> D+1 delivery
    decision_d = date(2026, 1, 31)
    delivery_d = get_delivery_date_for_decision(decision_d)
    assert delivery_d == date(2026, 2, 1)


def test_get_decision_date_for_delivery():
    delivery_d = date(2026, 1, 2)
    decision_d = get_decision_date_for_delivery(delivery_d)
    assert decision_d == date(2026, 1, 1)


def test_generate_expected_half_hour_intervals_count():
    # 1 single day has 48 half-hour intervals
    start_d = date(2026, 1, 2)
    end_d = date(2026, 1, 2)
    intervals = generate_expected_half_hour_intervals(start_d, end_d)
    assert len(intervals) == 48
    assert format_iso_utc(intervals[0]) == "2026-01-02T00:00:00Z"
    assert format_iso_utc(intervals[-1]) == "2026-01-02T23:30:00Z"


def test_generate_expected_half_hour_intervals_multi_day():
    # 3 days = 3 * 48 = 144 intervals
    start_d = date(2026, 1, 2)
    end_d = date(2026, 1, 4)
    intervals = generate_expected_half_hour_intervals(start_d, end_d)
    assert len(intervals) == 144
