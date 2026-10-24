"""
Time and Date Processing Utilities
Handles timezone conversions (Europe/London <-> UTC), cutoff resolution,
and delivery interval generation for UK wholesale power procurement.
"""

from datetime import datetime, date, time, timedelta, timezone
from typing import List, Tuple
import pytz
from dateutil import parser as date_parser

LONDON_TZ = pytz.timezone("Europe/London")
UTC_TZ = timezone.utc


def parse_iso_datetime(dt_str: str) -> datetime:
    """
    Parses an ISO datetime string and ensures it is timezone-aware in UTC.
    """
    if not dt_str:
        raise ValueError("Datetime string cannot be empty")
    
    parsed = date_parser.parse(dt_str)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC_TZ)
    return parsed.astimezone(UTC_TZ)


def format_iso_utc(dt: datetime) -> str:
    """
    Formats a datetime object to standard ISO 8601 UTC string (YYYY-MM-DDTHH:MM:SSZ).
    """
    utc_dt = dt.astimezone(UTC_TZ)
    return utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def format_uk_local(dt: datetime) -> str:
    """
    Formats a datetime object to UK local time string with GMT/BST indicator.
    """
    local_dt = dt.astimezone(LONDON_TZ)
    return local_dt.strftime("%Y-%m-%d %H:%M %Z")


def get_decision_cutoff_utc(decision_date: date, cutoff_time_str: str = "11:00") -> datetime:
    """
    Given a purchasing decision date D (e.g., 2026-01-05) and a cutoff time string (e.g. '11:00'),
    interprets the cutoff in Europe/London timezone and returns the corresponding UTC datetime.
    
    Example:
    2026-01-05 at 11:00 London time -> 2026-01-05T11:00:00Z (during GMT)
    """
    parts = cutoff_time_str.strip().split(":")
    if len(parts) != 2:
        raise ValueError(f"Invalid cutoff time format '{cutoff_time_str}'. Expected HH:MM.")
    hour = int(parts[0])
    minute = int(parts[1])
    
    naive_dt = datetime.combine(decision_date, time(hour, minute, 0))
    # Localize with DST awareness in London timezone
    local_dt = LONDON_TZ.localize(naive_dt, is_dst=None)
    return local_dt.astimezone(UTC_TZ)


def get_delivery_date_for_decision(decision_date: date) -> date:
    """
    UK day-ahead wholesale market:
    For purchasing decision date D, power delivery is for D + 1 calendar day.
    """
    return decision_date + timedelta(days=1)


def get_decision_date_for_delivery(delivery_date: date) -> date:
    """
    Inverse of get_delivery_date_for_decision: delivery on date D+1 corresponds to decision on D.
    """
    return delivery_date - timedelta(days=1)


def generate_expected_half_hour_intervals(start_delivery_date: date, end_delivery_date: date) -> List[datetime]:
    """
    Generates all standard half-hourly delivery intervals (start times in UTC)
    covering the delivery dates from start_delivery_date to end_delivery_date inclusive.
    Each day starts at 00:00:00 London local time.
    """
    intervals: List[datetime] = []
    current_date = start_delivery_date
    
    while current_date <= end_delivery_date:
        # Determine day start and next day start in London local time
        day_start_local = LONDON_TZ.localize(datetime.combine(current_date, time(0, 0, 0)), is_dst=None)
        next_day_local = LONDON_TZ.localize(datetime.combine(current_date + timedelta(days=1), time(0, 0, 0)), is_dst=None)
        
        day_start_utc = day_start_local.astimezone(UTC_TZ)
        next_day_utc = next_day_local.astimezone(UTC_TZ)
        
        curr_step = day_start_utc
        while curr_step < next_day_utc:
            intervals.append(curr_step)
            curr_step += timedelta(minutes=30)
            
        current_date += timedelta(days=1)
        
    return intervals
