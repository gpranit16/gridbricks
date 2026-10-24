# GridBricks | UK Wind Forecast & Accuracy Analytics Terminal

> **Wholesale Electricity Day-Ahead Procurement Analytics for the Great Britain Power Market**  
> Built for wholesale power procurement teams to reconstruct gate-closure wind generation forecasts, quantify forecast accuracy against Elexon BMRS metered outturn, and manage day-ahead imbalance risks.

---

## 1. Executive Summary & Problem Setting

In the United Kingdom wholesale electricity market, an energy utility must purchase sufficient electrical energy in day-ahead auctions (e.g. EPEX SPOT and Nord Pool / N2EX) to meet retail customer demand for the following delivery day. 

Because renewable wind generation is weather-dependent and non-dispatchable, procurement teams rely on day-ahead wind generation forecasts to calculate net thermal procurement requirements (e.g. from combined-cycle gas turbines, biomass, or cross-border interconnectors). 

Wholesale power order books close at a fixed gate closure cutoff (default **11:00 AM London local time** on Day $D$) for physical delivery on Day $D + 1$. Any forecast updates published *after* gate closure were unavailable to the procurement desk when making binding financial commitments.

**GridBricks** solves this challenge by:
1. Reconstructing the exact, latest wind generation forecast available before gate closure on Day $D$ for every half-hourly settlement period on Delivery Day $D + 1$.
2. Pairing historical forecasts with metered actual wind generation from Elexon BMRS.
3. Quantifying forecast errors through industry-standard statistical metrics: **Mean Absolute Error (MAE)**, **Root Mean Squared Error (RMSE)**, and **Mean Forecast Bias**.
4. Providing actionable imbalance risk profiles and clear procurement guardrails without misleading traders on consumer demand.

---

## 2. Core Features

- **Executive Overview & KPI Dashboard:** Real-time visibility into MAE, RMSE, Mean Forecast Bias, Forecast Coverage, and Average Generation.
- **Interactive Forecast Explorer:** Time-series charts comparing Day-Ahead Forecasts (WINDFOR) against Metered Actuals (FUELHH) with settlement period inspector, timeline zoom, and error area bands.
- **Quantitative Error & Risk Profiling:** Error distribution histograms, shortfall vs surplus volume calculations (MWh / GWh), and Top 10 extreme error outlier intervals.
- **Granular Data Grid:** Searchable, sortable, and paginated half-hourly records with live status badges (`MATCHED`, `MISSING_FORECAST`, `MISSING_ACTUAL`).
- **Streaming CSV Export:** Immediate download of filtered interval records with UTC and UK Local timestamps.
- **Methodology & Provenance Hub:** Transparent formulas, Elexon endpoint specifications, and gate-closure assumptions.
- **Resilient Dual-Tier Architecture:** MongoDB Atlas caching with automatic failover to local storage for sub-millisecond response times.

---

## 3. Technology Stack

| Layer | Technologies | Rationale |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Modern, type-safe, ultra-fast development and compilation |
| **Styling & Icons** | Tailwind CSS, Lucide React | Energy trading dark terminal aesthetic with HSL tokens |
| **Charts** | Recharts | Composed responsive time-series charts with custom tooltips |
| **Backend API** | Python 3.12, FastAPI, Uvicorn | Asynchronous performance, automatic OpenAPI documentation |
| **Data Processing** | Pandas, NumPy, Python-Dateutil, Pytz | High-precision time-series alignment and timezone resolution |
| **Validation** | Pydantic v2 | Strict contract validation between API layers |
| **Database & Cache** | MongoDB Atlas (`gopratle`), PyMongo | High-speed document caching for historical Elexon streams |
| **Testing** | Pytest, Vitest, React Testing Library | Comprehensive unit, hand-checkable, and integration tests |
| **Containers & CI** | Docker, Docker Compose, GitHub Actions | Multi-stage production containerization and automated CI |

---

## 4. Architecture & Data Flow

```mermaid
graph TD
    User([Wholesale Procurement Trader]) -->|Web Browser / Terminal| UI[React 18 TypeScript Dashboard]
    UI -->|REST / JSON / CSV| API[FastAPI Gateway :8000]
    
    subgraph Backend Pipeline
        API --> TimeUtils[TimeUtils: Europe/London & UTC]
        API --> Selector[ForecastSelector: Cutoff Filter & Deduplication]
        API --> Alignment[DataAlignmentService: 30-min Grid Pairing]
        API --> Metrics[MetricsCalculator: MAE, RMSE, Bias]
        API --> Procurement[ProcurementContext: MWh & Risk]
    end
    
    Backend Pipeline <-->|Cache Tier 1| Mongo[(MongoDB Atlas: gopratle)]
    Backend Pipeline <-->|Cache Tier 2 (Failover)| LocalDisk[(Local JSON Cache)]
    
    Selector -->|HTTPX Client| ElexonAPI[Elexon BMRS Open API]
    ElexonAPI -->|WINDFOR Stream| ElexonForecasts[Wind Forecast Stream]
    ElexonAPI -->|FUELHH Stream| ElexonActuals[Actual Generation fuelType=WIND]
```

---

## 5. Repository File Structure

```
gridbricks/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application, CORS middleware, lifespan events
│   │   ├── config.py               # Pydantic BaseSettings, environment variable resolution
│   │   ├── api/
│   │   │   └── routes.py           # REST endpoints (/overview, /timeseries, /accuracy, /records, /export.csv)
│   │   ├── schemas/
│   │   │   └── analytics.py        # Pydantic request/response schema models
│   │   ├── clients/
│   │   │   └── elexon.py           # Elexon BMRS API client with exponential backoff & rate limiting
│   │   ├── services/
│   │   │   ├── time_utils.py       # Timezone conversion, DST, and delivery interval calculations
│   │   │   ├── forecast_selector.py# Gate-closure cutoff filtering & latest publication selection
│   │   │   ├── alignment.py        # 30-minute interval pairing & status determination
│   │   │   ├── pipeline.py         # End-to-end analytical workflow coordinator
│   │   │   └── procurement.py      # Energy volume calculations & trading risk guidelines
│   │   ├── analysis/
│   │   │   └── metrics.py          # Statistical accuracy calculations (MAE, RMSE, Bias, Histogram)
│   │   └── db/
│   │       └── mongo.py            # MongoDB Atlas connection and failover storage
│   ├── tests/                      # Pytest suite with hand-checkable validation tests
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Production Python 3.12-slim image
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, KPICard, Overview, Explorer, Accuracy, DataTable, Methodology
│   │   ├── services/api.ts         # Typed API client
│   │   ├── types/analytics.ts      # TypeScript interfaces
│   │   ├── tests/                  # Vitest & Testing Library component test suites
│   │   ├── App.tsx                 # Root application state and navigation
│   │   ├── main.tsx                # Entrypoint
│   │   └── index.css               # Design tokens, glassmorphism, scrollbars
│   ├── public/                     # Favicons and SVG assets
│   ├── nginx.conf                  # Nginx reverse proxy configuration
│   ├── Dockerfile                  # Multi-stage Node.js + Nginx build
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docs/
│   ├── architecture.md             # In-depth system design & component diagrams
│   ├── methodology.md              # Mathematical formulas & procurement foundations
│   ├── demo_script.md              # Part 1: Customer pitch script (5 minutes)
│   ├── technical_review_script.md  # Part 2: Technical lead review script (5 minutes)
│   └── submission_checklist.md     # Verification and deliverable audit checklist
├── .github/workflows/
│   └── tests.yml                   # GitHub Actions automated CI testing workflow
├── docker-compose.yml              # Local container orchestration
├── render.yaml                     # Render deployment blueprint
├── vercel.json                     # Vercel deployment blueprint
├── .env.example                    # Template environment variables
├── .gitignore                      # Git exclusion rules
├── LICENSE                         # MIT License
└── README.md                       # Comprehensive project documentation
```

---

## 6. Data Sources & Integration Methodology

### 6.1 Elexon BMRS Datasets
1. **Actual Wind Generation (`FUELHH` Stream)**:
   - **Documentation:** [Elexon FUELHH Documentation](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
   - **API Endpoint:** `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
   - **Filter Rule:** Filtered strictly for `fuelType == "WIND"`.
   - **Key Fields:** `startTime` (half-hourly UTC start time), `generation` (MW).
2. **Forecasted Wind Generation (`WINDFOR` Stream)**:
   - **Documentation:** [Elexon WINDFOR Documentation](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)
   - **API Endpoint:** `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
   - **Key Fields:** `startTime` (target delivery interval), `publishTime` (forecast creation time), `generation` (MW).

### 6.2 Decision Date ($D$) vs Delivery Date ($D+1$)
- Decisions submitted on Day $D$ correspond to electricity delivery across Day $D+1$.
- Default analytical period: **1 January 2026 to 31 January 2026 decisions** &rarr; covers **2 January 2026 to 1 February 2026 delivery**.
- Intervals are evaluated using 48 half-hour settlement periods per day in London local time (`Europe/London`).

### 6.3 Gate Closure Cutoff Assumption
- Standard day-ahead auctions close order books at **11:00 AM London local time** (e.g. EPEX SPOT UK Day-Ahead).
- The cutoff is user-configurable from the UI header (11:00, 12:00, 09:00, 14:00) without code modification.
- **Selection Algorithm:**
  $$\text{Selected Forecast}(T) = \arg\max_{F.\text{publishTime} \le \text{Cutoff}(D)} (F.\text{publishTime})$$
- Forecasts published *after* the cutoff are strictly excluded.
- If no forecast was published prior to cutoff, the interval is marked as `MISSING_FORECAST` rather than inventing synthetic numbers.

---

## 7. Statistical Error Formulas

All error metrics are evaluated strictly on paired intervals where `status == "MATCHED"`:

1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |F_i - A_i| \quad [\text{MW}]$$
2. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2} \quad [\text{MW}]$$
3. **Mean Forecast Bias:**
   $$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i) \quad [\text{MW}]$$
   - Positive bias indicates systematic overforecasting (volume deficit risk).
   - Negative bias indicates systematic underforecasting (volume surplus).
4. **Forecast Coverage:**
   $$\text{Coverage} = \left( \frac{N_{\text{matched}}}{N_{\text{expected}}} \right) \times 100\%$$
5. **Safe MAPE:**
   $$\text{MAPE} = \frac{1}{K} \sum_{i=1, A_i \ge 50}^{K} \left( \frac{|F_i - A_i|}{A_i} \right) \times 100\%$$

---

## 8. Procurement Decision Limitations (Mandatory Guardrails)

The dashboard includes a dedicated **Procurement Limitations Panel** clarifying:
1. **National Aggregation:** The data reflects total Great Britain national transmission wind output, not an individual utility's localized retail portfolio.
2. **Absence of Consumer Demand:** Net procurement volume requires knowing Retail Consumer Demand, which is outside the Elexon wind datasets.
3. **Market Price Dynamics:** Day-ahead procurement requires EPEX/N2EX hourly clearing prices and fuel spark spreads.
4. **Retrospective Shortfall:** The shortfall ($A_i < F_i$) is an ex-post insight discovered after physical delivery, not known at decision time.

---

## 9. Local Development & Quick Start

### 9.1 Prerequisites
- Python 3.12+
- Node.js 20+ and npm 10+
- Docker and Docker Compose (optional for containerized execution)

### 9.2 Environment Configuration
Create a `.env` file at the project root (or copy `.env.example`):
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
DATABASE_NAME=gopratle
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DEFAULT_CUTOFF_TIME=11:00
DEFAULT_START_DATE=2026-01-01
DEFAULT_END_DATE=2026-01-31
ELEXON_BASE_URL=https://data.elexon.co.uk/bmrs/api/v1
CACHE_TTL_SECONDS=86400
```

### 9.3 Running Backend Locally
```bash
# 1. Create and activate virtual environment
python -m venv backend/.venv
# Windows:
backend\.venv\Scripts\activate
# Linux/macOS:
source backend/.venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Start FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 9.4 Running Frontend Locally
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start Vite dev server
npm run dev
```
Dashboard will open at: `http://localhost:5173`

---

## 10. Docker Setup

To build and run both services containerized:
```bash
docker compose up --build
```
- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **Backend Health Check:** `http://localhost:8000/api/health`

---

## 11. Automated Testing

### 11.1 Backend Pytest Suite
Run 18 automated unit and integration tests covering cutoff selection, interval alignment, hand-checkable arithmetic, duplicate handling, and API endpoints:
```bash
# From workspace root:
pytest -v
```
*Result: 18 passed in 1.86s*

### 11.2 Frontend Vitest Suite
Run component and interaction test suites:
```bash
cd frontend
npm run test
```
*Result: 6 passed in 2.97s*

### 11.3 Production Build Check
```bash
cd frontend
npm run build
```
*Result: Production bundle compiled successfully in 21.9s*

---

## 12. Deployment Instructions

### 12.1 Deploying Backend to Render
1. Connect your repository to Render.
2. Select **Web Service** and choose `render.yaml` or set:
   - **Environment:** Python 3.12
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/health`
3. Add environment variable `MONGODB_URI` from your credentials.

### 12.2 Deploying Frontend to Vercel
1. Import repository into Vercel.
2. Set Root Directory to `frontend`.
3. Set Build Command to `npm run build` and Output Directory to `dist`.
4. Environment variable: `VITE_API_BASE_URL` pointing to the deployed backend URL.

---

## 13. Video Demonstration & Deliverables

- **Live Session Recording:** Recorded using browser subagent session saved at:  
  `uk_wind_dashboard_demo_1792879802077.webp`
- **Customer Presentation Script (Part 1, 5 mins):** [`docs/demo_script.md`](docs/demo_script.md)
- **Technical Review Script (Part 2, 5 mins):** [`docs/technical_review_script.md`](docs/technical_review_script.md)
- **Submission Checklist:** [`docs/submission_checklist.md`](docs/submission_checklist.md)
- **Submission Form:** [Full Stack SWE challenge submission v4](https://forms.cloud.microsoft/r/Ljmf1aWESK)

---

## 14. Disclosure of AI Tool Usage

In accordance with Section 15 requirements, the development of this application was assisted by **DeepMind Antigravity AI** (paired with Gemini 3.8 Flash). AI assistance was utilized for:
- Accelerating full-stack scaffolding across FastAPI and React 18.
- Synthesizing UI/UX design tokens following the `ui-ux-pro-max` design system.
- Generating hand-checkable unit test fixtures for mathematical validation.
- Structuring technical documentation and presentation transcripts.

All analytical logic, Elexon API integrations, and mathematical formulas were deterministically developed, verified, and unit-tested.

---

## 15. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
