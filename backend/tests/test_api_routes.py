"""
Integration tests for FastAPI endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["health_check"] == "/api/health"


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "database_connected" in data


def test_invalid_date_range_returns_400():
    # End date earlier than start date
    response = client.get("/api/analytics/overview?startDate=2026-01-20&endDate=2026-01-10")
    assert response.status_code == 400
    assert "cannot be after" in response.json()["detail"]


@patch("backend.app.clients.elexon.elexon_client.fetch_actual_wind_generation")
@patch("backend.app.clients.elexon.elexon_client.fetch_wind_forecasts")
def test_overview_endpoint_mocked(mock_forecasts, mock_actuals):
    mock_actuals.return_value = [
        {"startTime": "2026-01-02T00:00:00Z", "fuelType": "WIND", "generation": 10500}
    ]
    mock_forecasts.return_value = [
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T10:00:00Z", "generation": 10000}
    ]

    response = client.get("/api/analytics/overview?startDate=2026-01-01&endDate=2026-01-01&cutoffTime=11:00")
    assert response.status_code == 200
    data = response.json()
    assert "decisionPeriod" in data
    assert "metrics" in data
    assert data["metrics"]["totalExpectedIntervals"] == 48


@patch("backend.app.clients.elexon.elexon_client.fetch_actual_wind_generation")
@patch("backend.app.clients.elexon.elexon_client.fetch_wind_forecasts")
def test_csv_export_endpoint(mock_forecasts, mock_actuals):
    mock_actuals.return_value = [
        {"startTime": "2026-01-02T00:00:00Z", "fuelType": "WIND", "generation": 10500}
    ]
    mock_forecasts.return_value = [
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T10:00:00Z", "generation": 10000}
    ]

    response = client.get("/api/analytics/export.csv?startDate=2026-01-01&endDate=2026-01-01&cutoffTime=11:00")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=" in response.headers["content-disposition"]
    content = response.text
    assert "decision_date" in content
    assert "forecast_generation_mw" in content
