"""
Pydantic Schemas for API Requests and Responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    database_connected: bool
    elexon_api_status: str
    timestamp: str


class SummaryMetrics(BaseModel):
    totalExpectedIntervals: int
    matchedIntervals: int
    missingForecastCount: int
    missingActualCount: int
    missingBothCount: int
    forecastCoveragePercent: float
    mae: Optional[float] = None
    rmse: Optional[float] = None
    bias: Optional[float] = None
    mape: Optional[float] = None
    avgForecastMw: Optional[float] = None
    avgActualMw: Optional[float] = None
    maxForecastMw: Optional[float] = None
    maxActualMw: Optional[float] = None
    maxAbsoluteErrorMw: Optional[float] = None
    unit: str = "MW"


class IntervalRecord(BaseModel):
    deliveryInterval: str
    deliveryIntervalLocal: str
    decisionDate: str
    deliveryDate: str
    decisionCutoffUtc: str
    settlementPeriod: int
    publishTime: Optional[str] = None
    forecastGeneration: Optional[float] = None
    actualGeneration: Optional[float] = None
    signedError: Optional[float] = None
    absoluteError: Optional[float] = None
    squaredError: Optional[float] = None
    percentageError: Optional[float] = None
    status: str
    unit: str = "MW"


class OverviewResponse(BaseModel):
    decisionPeriod: Dict[str, str]
    deliveryPeriod: Dict[str, str]
    decisionCutoffTime: str
    latestForecastPublishTime: Optional[str] = None
    metrics: SummaryMetrics
    dataFreshness: Dict[str, Any]
    metadata: Dict[str, Any]


class TimeseriesResponse(BaseModel):
    decisionPeriod: Dict[str, str]
    deliveryPeriod: Dict[str, str]
    decisionCutoffTime: str
    totalIntervals: int
    intervals: List[IntervalRecord]


class ErrorDistributionBin(BaseModel):
    range: str
    min: float
    max: float
    count: int
    type: str


class OutlierInterval(BaseModel):
    deliveryInterval: str
    deliveryIntervalLocal: str
    settlementPeriod: int
    forecastGeneration: float
    actualGeneration: float
    signedError: float
    absoluteError: float
    publishTime: Optional[str] = None
    impact: str


class AccuracyResponse(BaseModel):
    decisionPeriod: Dict[str, str]
    decisionCutoffTime: str
    metrics: SummaryMetrics
    errorDistribution: List[ErrorDistributionBin]
    largestErrorIntervals: List[OutlierInterval]
    procurementContext: Dict[str, Any]


class PaginatedRecordsResponse(BaseModel):
    total: int
    page: int
    pageSize: int
    totalPages: int
    records: List[IntervalRecord]
