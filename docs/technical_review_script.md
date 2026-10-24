# Technical Review Script: Architecture & Codebase Walkthrough (Part 2)

**Target Audience:** Technical Lead / Senior Engineering Reviewer  
**Tone:** Technical, precise, architectural, code-oriented  
**Target Duration:** 4 minutes 50 seconds (Max 5 minutes)  

---

## Script Breakdown & Timeline

### 0:00 – 0:50 | Architecture & Stack Overview
* **Visual:** Displaying the architecture diagram and project root in the IDE.
* **Speaker:**
  > "Hi everyone. For Part 2 of this demonstration, we'll walk through the technical architecture, data-processing pipeline, and automated test suite of GridBricks.
  >
  > The system is architected as a decoupled full-stack application:
  > - **Backend:** Python 3.12 with **FastAPI**, **Pydantic v2**, and **HTTPX**. FastAPI gives us high-performance async capabilities and strict request/response type validation.
  > - **Frontend:** **React 18** bootstrapped with **Vite** and **TypeScript**, styled using Tailwind CSS and Recharts.
  > - **Persistence & Caching:** We use a dual-tier strategy. Persistent caching is backed by **MongoDB Atlas** (`gopratle` cluster), configured directly via the requested `MONGODB_URI` environment variable, backed by an automatic failover to local disk/memory storage if network latency spikes.
  > - **Data Ingestion:** The backend interfaces directly with Elexon BMRS open datasets: `FUELHH` for metered actuals and `WINDFOR` for forecasts."

---

### 0:50 – 1:50 | Data-Processing & Decision Cutoff Logic
* **Visual:** Showing `backend/app/services/forecast_selector.py` and `backend/app/services/time_utils.py` in the editor.
* **Speaker:**
  > "Let's examine the core business logic: historical decision reconstruction.
  >
  > In `time_utils.py`, we strictly handle timezone conversions between `Europe/London` and `UTC`. Because the UK Day-Ahead auction cutoff (default 11:00 AM) occurs in local London time, we resolve daylight saving differences deterministically.
  >
  > In `forecast_selector.py`:
  > 1. For any target interval on Delivery Date $D+1$, the decision was made on Date $D$.
  > 2. We filter all historical publications from `WINDFOR` where `publishTime <= Cutoff(D)`.
  > 3. If a forecast was published at 11:00:01, it is strictly excluded.
  > 4. We then select the candidate with the latest `publishTime`.
  > 5. For duplicate timestamps, we apply a deterministic deduplication rule.
  >
  > This guarantees that our backtest perfectly replicates the exact informational snapshot available to the trader at gate closure."

---

### 1:50 – 2:50 | Interval Alignment & Analysis Implementation
* **Visual:** Opening `backend/app/services/alignment.py` and `backend/app/analysis/metrics.py`.
* **Speaker:**
  > "Next, in `alignment.py`:
  > - We generate the full grid of 48 half-hour settlement periods per delivery day.
  > - We match records using normalized ISO-8601 UTC timestamps, never relying on array indexing or visual approximations.
  > - We assign explicit status codes: `MATCHED`, `MISSING_FORECAST`, `MISSING_ACTUAL`. Notice that if a forecast is missing for an interval (such as half-hours between hourly Elexon runs), we record it transparently as `MISSING_FORECAST` rather than inventing artificial values.
  >
  > In `metrics.py`:
  > - Statistical formulas — MAE, RMSE, Mean Forecast Bias, Safe MAPE, and Error Distribution Bins — are computed exclusively on matched pairs.
  > - All calculations are strictly separated from the presentation layer, making them portable and verifiable."

---

### 2:50 – 3:40 | Codebase Structure & Route Contracts
* **Visual:** Expanding `backend/app/api/routes.py` and `frontend/src/services/api.ts`.
* **Speaker:**
  > "Looking at the codebase organization:
  > - Every module has a single responsibility.
  > - API routes in `routes.py` implement:
  >   - `GET /api/health`: reports service and database status.
  >   - `GET /api/analytics/overview`: summary metrics and period metadata.
  >   - `GET /api/analytics/timeseries`: chart-ready generation arrays.
  >   - `GET /api/analytics/accuracy`: error distributions and risk profiles.
  >   - `GET /api/analytics/records`: paginated, sortable records for the grid.
  >   - `GET /api/analytics/export.csv`: streaming CSV download.
  > - On the frontend, `frontend/src/services/api.ts` maps directly to these endpoints with TypeScript interfaces in `types/analytics.ts` guaranteeing end-to-end type safety."

---

### 3:40 – 4:25 | Testing & Docker Containerization
* **Visual:** Terminal showing execution of `pytest` (18 passing tests) and `vitest` (6 passing tests).
* **Speaker:**
  > "Testing was built into the development cycle from day one.
  > - On the backend, we run `pytest` covering 18 automated unit and integration tests. This includes hand-checkable arithmetic tests for MAE and RMSE, exact cutoff boundary tests, duplicate handling, and mocked API route checks.
  > - On the frontend, we run `vitest` with React Testing Library, testing component rendering, filter interactions, and KPI formatting.
  >
  > For orchestration:
  > - We provide `backend/Dockerfile` with a lightweight Python 3.12-slim base and health check.
  > - `frontend/Dockerfile` uses a multi-stage build: building assets with Node 22 and serving them via Nginx with an API reverse proxy.
  > - `docker-compose.yml` launches both containers seamlessly with a single `docker compose up` command."

---

### 4:25 – 5:00 | Cloud Deployment, Trade-offs & Next Steps
* **Visual:** Showing `render.yaml`, `vercel.json`, and `.github/workflows/tests.yml`.
* **Speaker:**
  > "For deployment:
  > - We prepared `render.yaml` for containerized backend hosting and `vercel.json` for frontend edge delivery with API rewrites.
  > - Continuous Integration is configured via `.github/workflows/tests.yml` running both test suites and production builds on every commit.
  >
  > Technical Trade-offs & Next Steps:
  > - We chose MongoDB Atlas with local failover to guarantee sub-millisecond response times for dashboard users.
  > - As a next phase, we would integrate Elexon's Intraday forecast stream to track forecast evolution between 11:00 AM gate closure and real-time delivery.
  >
  > This concludes the technical review of GridBricks. Thank you!"
