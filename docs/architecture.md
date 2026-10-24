# Technical Architecture: UK Wind Forecast & Accuracy Analytics

## 1. System Overview

**GridBricks** is a production-grade analytics terminal designed for wholesale electricity procurement teams at UK energy utilities. Its primary mission is to reconstruct historical day-ahead wind generation forecasts available prior to wholesale power market gate closure and quantitatively evaluate their accuracy against metered transmission system outturn.

```
+-----------------------------------------------------------------------------------------+
|                                    USER INTERFACE                                       |
|  React 18 + TypeScript + Vite + Tailwind CSS + Recharts (Dark Trading Terminal Design)  |
|  Executive Overview  |  Forecast Explorer  |  Accuracy & Risk  |  Data Table  |  Docs   |
+-----------------------------------------------------------------------------------------+
                                             |
                                    REST API / JSON / CSV
                                             v
+-----------------------------------------------------------------------------------------+
|                                  BACKEND API GATEWAY                                    |
|                      Python 3.12 + FastAPI + Uvicorn + Pydantic v2                      |
|                                                                                         |
|  +--------------------+  +-----------------------+  +--------------------------------+  |
|  | /api/analytics/    |  | /api/analytics/       |  | /api/analytics/records         |  |
|  | overview           |  | timeseries & accuracy |  | & export.csv                   |  |
|  +--------------------+  +-----------------------+  +--------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                             |
                   +-------------------------+-------------------------+
                   |                                                   |
                   v                                                   v
+--------------------------------------+             +------------------------------------+
|          SERVICES & PIPELINE         |             |       PERSISTENCE & CACHING        |
| - TimeUtils (Europe/London & UTC)    |             | - MongoDB Atlas Cluster (gopratle) |
| - ForecastSelector (Cutoff & Filter) |<----------->| - Failover Disk/Memory Cache       |
| - DataAlignmentService (30m Grid)    |             | - Collections:                     |
| - MetricsCalculator (MAE, RMSE, Bias)|             |   * elexon_fuelhh (Actuals)        |
| - ProcurementContextService          |             |   * elexon_windfor (Forecasts)     |
+--------------------------------------+             |   * analytics_cache (Computed)     |
                   |                                 +------------------------------------+
                   v
+-----------------------------------------------------------------------------------------+
|                                EXTERNAL DATA SOURCES                                    |
|                         Elexon BMRS API (data.elexon.co.uk)                             |
|  1. WINDFOR Stream: /datasets/WINDFOR/stream (National Wind Generation Forecasts)        |
|  2. FUELHH Stream:  /datasets/FUELHH/stream  (Half-Hourly Metered Generation, WIND)     |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Key Architecture Principles

### 2.1 Pure Historical Decision Reconstruction
In the UK Day-Ahead wholesale market, traders purchase power on Day $D$ for delivery on Day $D+1$. Market order books (e.g. EPEX SPOT and Nord Pool / N2EX) close at an authoritative gate closure cutoff (default 11:00 London time).
The system enforces strict historical integrity:
1. Every delivery interval on $D+1$ is matched only with forecasts where `publishTime <= Cutoff(D)`.
2. Forecasts published after the cutoff are filtered out, simulating the exact information state available to traders at decision time.
3. The latest eligible forecast prior to cutoff is selected.

### 2.2 Dual-Tier Caching & Failover Resilience
1. **Tier 1 (MongoDB Atlas)**: Stores normalized raw Elexon records and computed analytical snapshots in the `gopratle` database under `elexon_fuelhh`, `elexon_windfor`, and `analytics_cache`.
2. **Tier 2 (Resilient Local Fallback)**: If MongoDB Atlas experiences a network timeout or connection reset, the system automatically falls back to local disk and memory caching, ensuring zero disruption or 500 errors to end users.

### 2.3 Strict Separation of Analytical Concerns
- React components handle visualization and user interaction exclusively.
- All statistical error formulas (MAE, RMSE, Bias, Coverage, Outliers) are calculated deterministically on the Python backend using hand-checkable algorithms.
- Megawatts (MW), energy volume (MWh / GWh), and percentages (%) are strictly demarcated across models and UI components.

---

## 3. Directory Layout

```
gridbricks/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint, CORS, lifespan
│   │   ├── config.py           # Settings, .env resolution
│   │   ├── api/routes.py       # REST API endpoints
│   │   ├── schemas/analytics.py# Pydantic response models
│   │   ├── clients/elexon.py   # Resilient HTTPX client for Elexon BMRS
│   │   ├── services/
│   │   │   ├── time_utils.py   # London/UTC timezones, gate closure calculation
│   │   │   ├── forecast_selector.py # Historical cutoff filter & selection
│   │   │   ├── alignment.py    # 30-min interval pairing & status assignment
│   │   │   ├── pipeline.py     # End-to-end pipeline orchestration
│   │   │   └── procurement.py  # MWh volumes, shortfall/surplus risk analysis
│   │   ├── analysis/metrics.py # MAE, RMSE, Bias, histogram calculation
│   │   └── db/mongo.py         # MongoDB Atlas persistence & failover
│   ├── tests/                  # Pytest test suite (18 unit/integration tests)
│   ├── requirements.txt        # Backend dependencies
│   └── Dockerfile              # Python 3.12 slim container
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, KPICard, Overview, Explorer, Accuracy, DataTable, Methodology
│   │   ├── services/api.ts     # Typed frontend API client
│   │   ├── types/analytics.ts  # TypeScript contracts
│   │   ├── tests/              # Vitest & Testing Library tests
│   │   ├── App.tsx             # Root dashboard controller
│   │   ├── main.tsx            # DOM mount
│   │   └── index.css           # Tailwind & custom tokens
│   ├── Dockerfile              # Multi-stage Node + Nginx build
│   ├── nginx.conf              # Production Nginx reverse proxy
│   ├── package.json
│   └── vite.config.ts
├── docs/                       # Architecture, methodology, demo scripts
├── .github/workflows/tests.yml # CI pipeline
├── docker-compose.yml          # Container orchestration
├── render.yaml                 # Render cloud deployment blueprint
├── vercel.json                 # Vercel frontend deployment
├── README.md                   # Full documentation
└── LICENSE                     # MIT License
```
