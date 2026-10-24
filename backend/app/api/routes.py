"""
FastAPI Analytics Routes
Exposes REST endpoints for summary metrics, time series, error analysis, paginated tabular records, and CSV export.
"""

import io
import csv
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Response
from fastapi.responses import StreamingResponse
from backend.app.config import settings
from backend.app.schemas.analytics import (
    HealthResponse,
    OverviewResponse,
    TimeseriesResponse,
    AccuracyResponse,
    PaginatedRecordsResponse
)
from backend.app.services.pipeline import pipeline_coordinator
from backend.app.db.mongo import mongo_service
from backend.app.clients.elexon import elexon_client

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
def get_health():
    """Application health and dependency status."""
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        database_connected=mongo_service.is_connected(),
        elexon_api_status="operational",
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@router.get("/analytics/overview", response_model=OverviewResponse)
def get_overview(
    startDate: str = Query(default=settings.DEFAULT_DECISION_START_DATE, description="Decision start date (YYYY-MM-DD)"),
    endDate: str = Query(default=settings.DEFAULT_DECISION_END_DATE, description="Decision end date (YYYY-MM-DD)"),
    cutoffTime: str = Query(default=settings.DEFAULT_CUTOFF_TIME, description="Gate closure cutoff time (HH:MM)")
):
    """Retrieves high-level summary metrics, coverage, and data freshness."""
    try:
        pipeline_data = pipeline_coordinator.execute_pipeline(
            decision_start_date=startDate,
            decision_end_date=endDate,
            cutoff_time_str=cutoffTime
        )
        return OverviewResponse(
            decisionPeriod=pipeline_data["decisionPeriod"],
            deliveryPeriod=pipeline_data["deliveryPeriod"],
            decisionCutoffTime=pipeline_data["decisionCutoffTime"],
            latestForecastPublishTime=pipeline_data["latestForecastPublishTime"],
            metrics=pipeline_data["metrics"],
            dataFreshness=pipeline_data["dataFreshness"],
            metadata=pipeline_data["metadata"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@router.get("/analytics/timeseries", response_model=TimeseriesResponse)
def get_timeseries(
    startDate: str = Query(default=settings.DEFAULT_DECISION_START_DATE),
    endDate: str = Query(default=settings.DEFAULT_DECISION_END_DATE),
    cutoffTime: str = Query(default=settings.DEFAULT_CUTOFF_TIME)
):
    """Retrieves paired forecast and actual generation time-series for chart visualisations."""
    try:
        pipeline_data = pipeline_coordinator.execute_pipeline(
            decision_start_date=startDate,
            decision_end_date=endDate,
            cutoff_time_str=cutoffTime
        )
        records = pipeline_data["alignedRecords"]
        return TimeseriesResponse(
            decisionPeriod=pipeline_data["decisionPeriod"],
            deliveryPeriod=pipeline_data["deliveryPeriod"],
            decisionCutoffTime=pipeline_data["decisionCutoffTime"],
            totalIntervals=len(records),
            intervals=records
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@router.get("/analytics/accuracy", response_model=AccuracyResponse)
def get_accuracy(
    startDate: str = Query(default=settings.DEFAULT_DECISION_START_DATE),
    endDate: str = Query(default=settings.DEFAULT_DECISION_END_DATE),
    cutoffTime: str = Query(default=settings.DEFAULT_CUTOFF_TIME)
):
    """Retrieves statistical error analysis, histograms, worst error intervals, and procurement implications."""
    try:
        pipeline_data = pipeline_coordinator.execute_pipeline(
            decision_start_date=startDate,
            decision_end_date=endDate,
            cutoff_time_str=cutoffTime
        )
        metrics = pipeline_data["metrics"]
        return AccuracyResponse(
            decisionPeriod=pipeline_data["decisionPeriod"],
            decisionCutoffTime=pipeline_data["decisionCutoffTime"],
            metrics=metrics,
            errorDistribution=metrics["errorDistribution"],
            largestErrorIntervals=metrics["largestErrorIntervals"],
            procurementContext=pipeline_data["procurementContext"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@router.get("/analytics/records", response_model=PaginatedRecordsResponse)
def get_records(
    startDate: str = Query(default=settings.DEFAULT_DECISION_START_DATE),
    endDate: str = Query(default=settings.DEFAULT_DECISION_END_DATE),
    cutoffTime: str = Query(default=settings.DEFAULT_CUTOFF_TIME),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=50, ge=5, le=200),
    sortBy: str = Query(default="deliveryInterval"),
    sortOrder: str = Query(default="asc"),
    status: Optional[str] = Query(default=None)
):
    """Retrieves filterable, sortable, and paginated records for the data grid."""
    try:
        pipeline_data = pipeline_coordinator.execute_pipeline(
            decision_start_date=startDate,
            decision_end_date=endDate,
            cutoff_time_str=cutoffTime
        )
        records = pipeline_data["alignedRecords"]
        
        # Filter by status if provided
        if status and status.upper() != "ALL":
            records = [r for r in records if r["status"] == status.upper()]
            
        # Sorting
        reverse = (sortOrder.lower() == "desc")
        if sortBy in ["absoluteError", "signedError", "forecastGeneration", "actualGeneration"]:
            records = sorted(
                records,
                key=lambda x: (x.get(sortBy) is None, x.get(sortBy) or 0.0),
                reverse=reverse
            )
        else:
            records = sorted(
                records,
                key=lambda x: x.get(sortBy) or "",
                reverse=reverse
            )
            
        total = len(records)
        total_pages = (total + pageSize - 1) // pageSize if total > 0 else 1
        start_idx = (page - 1) * pageSize
        end_idx = start_idx + pageSize
        paginated_records = records[start_idx:end_idx]
        
        return PaginatedRecordsResponse(
            total=total,
            page=page,
            pageSize=pageSize,
            totalPages=total_pages,
            records=paginated_records
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@router.get("/analytics/export.csv")
def export_csv(
    startDate: str = Query(default=settings.DEFAULT_DECISION_START_DATE),
    endDate: str = Query(default=settings.DEFAULT_DECISION_END_DATE),
    cutoffTime: str = Query(default=settings.DEFAULT_CUTOFF_TIME)
):
    """Exports currently filtered paired records as a standard CSV file."""
    try:
        pipeline_data = pipeline_coordinator.execute_pipeline(
            decision_start_date=startDate,
            decision_end_date=endDate,
            cutoff_time_str=cutoffTime
        )
        records = pipeline_data["alignedRecords"]
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "decision_date",
            "delivery_date",
            "delivery_interval_utc",
            "delivery_interval_local",
            "settlement_period",
            "forecast_publication_time_utc",
            "decision_cutoff_utc",
            "forecast_generation_mw",
            "actual_generation_mw",
            "signed_forecast_error_mw",
            "absolute_error_mw",
            "percentage_error_pct",
            "matching_status"
        ])
        
        for r in records:
            writer.writerow([
                r.get("decisionDate"),
                r.get("deliveryDate"),
                r.get("deliveryInterval"),
                r.get("deliveryIntervalLocal"),
                r.get("settlementPeriod"),
                r.get("publishTime") or "N/A",
                r.get("decisionCutoffUtc"),
                r.get("forecastGeneration") if r.get("forecastGeneration") is not None else "",
                r.get("actualGeneration") if r.get("actualGeneration") is not None else "",
                r.get("signedError") if r.get("signedError") is not None else "",
                r.get("absoluteError") if r.get("absoluteError") is not None else "",
                r.get("percentageError") if r.get("percentageError") is not None else "",
                r.get("status")
            ])
            
        output.seek(0)
        filename = f"uk_wind_forecast_analytics_{startDate}_to_{endDate}_cutoff_{cutoffTime.replace(':', '')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV export error: {str(e)}")


@router.post("/analytics/sync")
def trigger_sync(
    startDate: str = Query(default=settings.DEFAULT_DECISION_START_DATE),
    endDate: str = Query(default=settings.DEFAULT_DECISION_END_DATE),
    cutoffTime: str = Query(default=settings.DEFAULT_CUTOFF_TIME)
):
    """Triggers an on-demand sync from Elexon and refreshes cache."""
    try:
        data = pipeline_coordinator.execute_pipeline(
            decision_start_date=startDate,
            decision_end_date=endDate,
            cutoff_time_str=cutoffTime,
            force_refresh=True
        )
        return {
            "status": "success",
            "message": f"Successfully synchronized and analyzed {len(data['alignedRecords'])} delivery intervals.",
            "metrics": data["metrics"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
