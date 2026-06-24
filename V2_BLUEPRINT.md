

---

## PART 1 — TOP 20 FEATURES BY RECRUITER IMPACT (ALL $0)

Ranked by (resume signal × interview defensibility × implementation feasibility at zero cost).

| # | Feature | Why it matters most |
|---|---------|----------------------|
| 1 | **Real flight/price dataset + real trained model with backtested metrics** | Converts "ML project" from claim to proof. This single item fixes the #1 credibility gap. |
| 2 | **Live deployed demo (frontend + backend + DB, all on free tiers)** | "Here's a link" beats any paragraph of description. |
| 3 | **CI/CD pipeline (GitHub Actions: lint, test, build, deploy)** | Green badge = proof of engineering hygiene, costs nothing, takes a day. |
| 4 | **Automated test suite (pytest + Jest/RTL) with coverage report** | Single biggest gap; trivial to add incrementally. |
| 5 | **Real authentication (Supabase Auth / Firebase Auth, free tier, JWT)** | Turns "User Profiles" from mockup into a real, securable feature. |
| 6 | **Price history tracking via scheduled scraper/API poll (GitHub Actions cron)** | This *is* "real-time tracking" done honestly and for $0 — no servers needed. |
| 7 | **Fare calendar (cheapest day-of-month heatmap) from real collected data** | Recognizable Google-Flights-style feature; great UI + real data story. |
| 8 | **Price drop alerts (email via free-tier transactional email, e.g. Resend 100/day)** | Demonstrates event-driven design + async jobs, a feature interviewers love to probe. |
| 9 | **Saved searches & watchlists (real DB-backed CRUD)** | Demonstrates full-stack CRUD + relational modeling, the most commonly tested skill. |
| 10 | **Anomaly detection on real price series (statistical, e.g. z-score/IQR or Isolation Forest)** | Replace fake "spike" banners with a documented, testable algorithm. |
| 11 | **Model explainability (SHAP values surfaced in UI)** | Huge ML-maturity signal; free (shap is open-source), differentiates from 95% of portfolio ML projects. |
| 12 | **API documentation (OpenAPI/Swagger auto-generated from FastAPI)** | Zero extra work if backend is FastAPI; shows professional API hygiene. |
| 13 | **Structured logging + error tracking (Sentry free tier)** | Real observability, not a fake "System Health" page. |
| 14 | **Rate limiting + input validation on every endpoint** | Security maturity signal, costs nothing (slowapi / FastAPI middleware). |
| 15 | **Admin dashboard with real usage analytics (API call counts, model latency, error rate) from your own DB** | Shows you understand operating software, not just building it. |
| 16 | **Dockerized local dev + docker-compose (Postgres + Redis + API + frontend)** | Universal DevOps signal, zero cost, 1:1 with how real teams onboard. |
| 17 | **Cheapest-date finder (calendar-based search across a date range using cached price data)** | Hopper/Skyscanner-style feature, directly demoable, drives engagement. |
| 18 | **Route popularity & market analytics from real aggregated data (not random numbers)** | Same UI you already have — just point it at real query results. |
| 19 | **Architecture Decision Records (ADRs) + system design doc in repo** | Shows engineering communication skill — heavily weighted in senior/staff interviews. |
| 20 | **Load test + documented performance numbers (Locust/k6, free, local)** | "I tested it to X req/s before failure" is a sentence almost no portfolio project earns. |

---

## PART 3 — DEEP DIVE: TOP 8 FEATURES (full spec)

### Feature 1 — Real Dataset + Real Trained Model
- **User value:** predictions are trustworthy, not theater.
- **Technical value:** forces you to do real feature engineering, train/test split, hyperparameter tuning, evaluation.
- **Resume value:** "Trained an XGBoost regression model on 300K+ historical fares (MAE $X, R² Y) using BTS/Kaggle data" is interview-defensible.
- **Difficulty:** Medium (2–4 days).
- **Free data sources:**
  - [Kaggle "Flight Price Prediction" dataset](https://www.kaggle.com/datasets) — domestic India fares, clean, ready for XGBoost.
  - [US DOT/BTS On-Time Performance data](https://www.transtats.bts.gov/) — free, real, huge, monthly, no key needed.
  - [Amadeus for Developers Self-Service API](https://developers.amadeus.com/) — free tier (test environment, no card for sandbox), real live flight offers for a "live" demo on top of the historical model.
- **Implementation steps:**
  1. Pull dataset (Kaggle CLI or BTS CSV download — both free, no auth needed for BTS).
  2. EDA notebook (pandas/matplotlib, free, local).
  3. Feature engineering: route, days-to-departure, day-of-week, season, carrier, stops.
  4. Train XGBoost with `train_test_split` + `GridSearchCV`/`Optuna` (free, local CPU).
  5. Log metrics with MLflow (self-hosted, free, local SQLite backend) instead of SageMaker Experiments.
  6. Export model as `model.pkl`/`model.json`, version it in repo (or DVC + free Google Drive remote if it gets large).
  7. Serve via FastAPI `/predict` endpoint that loads the pickled model at startup.
- **Free tools:** Kaggle, pandas, scikit-learn, XGBoost, MLflow (OSS, self-hosted), Optuna.
- **DB changes:** `predictions` table logging every inference (input features, output, timestamp, model_version) for later drift analysis.
- **API changes:** `POST /api/v1/predict` (route, date, days_to_departure) → price + confidence interval.
- **UI changes:** Price Prediction screen calls the real endpoint, displays confidence interval and top-3 SHAP feature contributions.

### Feature 2 — Live Deployed Demo
- **Why:** unclickable projects don't get credit.
- **Free stack:** Frontend → Vercel (free). Backend → Render free web service or Fly.io free allowance. DB → Neon or Supabase Postgres free tier. Cache → Upstash Redis free tier.
- **Steps:** containerize backend, push to GitHub, connect Render/Fly to repo for auto-deploy on push to `main`, set env vars in dashboard (never commit secrets), connect frontend to deployed API via `REACT_APP_API_URL`.
- **Gotcha to plan for:** free backend tiers spin down on idle (cold start ~30–50s). Mitigate with a documented "first load may take 30s — free tier" note, or a GitHub Actions cron hitting `/health` every 10 min to keep it warm (still $0).

### Feature 3 — CI/CD
- **Steps:** `.github/workflows/ci.yml` running on every PR: `pip install -r requirements.txt && pytest`, `npm ci && npm test -- --watchAll=false`, `flake8`/`ruff` + `eslint`. Separate `deploy.yml` triggered on merge to `main` that calls Render/Vercel deploy hooks.
- **Free tools:** GitHub Actions (free for public repos, 2000 min/month free for private).

### Feature 4 — Test Suite
- **Backend:** pytest + `httpx.AsyncClient` for FastAPI endpoint tests, `pytest-cov` for coverage, a model-sanity test (prediction stays within plausible bounds, e.g. $20–$5000).
- **Frontend:** Jest + React Testing Library for each component (already scaffolded by `react-scripts`, currently unused — `npm test` runs but no real assertions exist).
- **Target:** ≥70% backend coverage on business logic, smoke tests on every page.

### Feature 5 — Real Auth
- **Free tool:** Supabase Auth (free tier: 50K MAU) issuing JWTs, or Firebase Auth (free tier, generous quota). Backend verifies JWT on protected routes (FastAPI dependency).
- **DB:** `users` table synced from auth provider (id, email, created_at, role).
- **UI:** real login/signup forms wired to Supabase client SDK; Profile/Settings pages read/write real user rows.

### Feature 6 — Price History via Scheduled Polling
- **Mechanism:** GitHub Actions scheduled workflow (`cron: */6 * * * *`-style, e.g. every 6 hours — free, no server needed) calls Amadeus free-tier sandbox or re-derives a synthetic-but-statistically-grounded series from the historical dataset, writes rows into `price_history`.
- **Why this is honest "real-time":** be explicit in the README that data refresh cadence is bounded by the free API tier's rate limit (Amadeus test env: ~2,000 calls/month) — this kind of disclosed constraint is exactly what a senior engineer respects.

### Feature 7 — Fare Calendar + Cheapest Date Finder
- **Mechanism:** query `price_history` grouped by date for a route, render a calendar heatmap (recharts/`react-calendar-heatmap`, free); "cheapest date finder" = `MIN(price)` over a date range query, surfaced with a one-click "search this date" CTA.

### Feature 8 — Anomaly Detection (real algorithm)
- **Mechanism:** rolling z-score or IQR-based outlier detection over `price_history` per route (scikit-learn `IsolationForest` as a stretch goal), computed in a scheduled job, written to an `anomalies` table, surfaced as real alerts — not a `Math.random() > 0.9` banner.

*(Features 9–20 follow the same pattern — DB-backed CRUD, scheduled jobs, and real queries replacing every mocked number. Full implementation notes for each are in Part 7's API/DB sections below; ping me before building any one of them and I'll spec it to this same depth.)*

---

## PART 4 — V2 ARCHITECTURE (all free tiers)

```
┌────────────────────────────────────────────────────────────────────┐
│                     FRONTEND — React 18 (Vercel, free)             │
│  Dashboard · Predict · Calendar · Watchlists · Admin · Auth        │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS / JWT
┌───────────────────────────▼──────────────────────────────────────┐
│              BACKEND — FastAPI (Render/Fly.io, free tier)          │
│  /auth  /predict  /search  /watchlist  /alerts  /admin  /health   │
│  Rate limiting · Pydantic validation · structured JSON logging    │
└──────┬───────────────┬───────────────┬───────────────┬───────────┘
       │               │               │               │
       ▼               ▼               ▼               ▼
┌────────────┐  ┌──────────────┐ ┌────────────┐ ┌────────────────┐
│ Postgres   │  │ Redis        │ │ ML Model   │ │ Sentry (free)  │
│ (Neon/     │  │ (Upstash,    │ │ (XGBoost,  │ │ error tracking │
│ Supabase)  │  │ free tier)   │ │ pkl, in-   │ └────────────────┘
│ free tier  │  │ cache+rate-  │ │ process)   │
└────────────┘  │ limit store  │ └────────────┘
                └──────────────┘
       ▲
       │ scheduled writes
┌──────┴───────────────────────────────────────────────────────────┐
│      GitHub Actions (cron) — price polling, model retrain,        │
│      anomaly-detection job, keep-warm ping                        │
│      Source: Amadeus free-tier sandbox + BTS/Kaggle historical    │
└────────────────────────────────────────────────────────────────────┘
```

No Kinesis, no Glue, no SageMaker, no CloudFormation, no AWS bill. Every box above has a $0 tier that doesn't expire on a trial clock (Neon/Supabase/Upstash/Render/Vercel/GitHub Actions free tiers are perpetual, not 12-month trials).

---

## PART 5 — DATABASE SCHEMA (Postgres)

```sql
users(id PK, email UNIQUE, role, created_at)
routes(id PK, origin, destination, distance_km)
price_history(id PK, route_id FK, observed_at, price, currency, source)
predictions(id PK, route_id FK, requested_at, predicted_price, confidence_low, confidence_high, model_version)
anomalies(id PK, route_id FK, detected_at, price, expected_price, deviation_score, severity)
watchlists(id PK, user_id FK, route_id FK, target_price, created_at)
alerts(id PK, watchlist_id FK, triggered_at, price_at_trigger, sent BOOLEAN)
saved_searches(id PK, user_id FK, origin, destination, date_range_start, date_range_end, created_at)
api_usage(id PK, user_id FK NULLABLE, endpoint, status_code, latency_ms, created_at)
audit_logs(id PK, user_id FK, action, resource, created_at)
```
Indexes: `(route_id, observed_at)` on `price_history` for calendar/range queries; `(user_id)` on `watchlists`/`saved_searches`.

---

## PART 6 — API DESIGN (REST, FastAPI, OpenAPI auto-docs)

```
POST   /api/v1/auth/signup | /login          (delegates to Supabase/Firebase)
GET    /api/v1/routes/popular
GET    /api/v1/prices/history?route_id=&from=&to=
GET    /api/v1/prices/calendar?route_id=&month=
GET    /api/v1/prices/cheapest-date?route_id=&from=&to=
POST   /api/v1/predict                       {route_id, date}
GET    /api/v1/anomalies?route_id=
POST   /api/v1/watchlists | GET | DELETE /{id}
POST   /api/v1/saved-searches | GET | DELETE /{id}
GET    /api/v1/admin/usage                   (role=admin only)
GET    /api/v1/health
```
All mutating routes: JWT required, Pydantic schema validation, rate-limited (slowapi, free).

---

## PART 7 — FOLDER STRUCTURE (target)

```
backend/
  app/
    api/v1/         # routers per resource
    core/            # config, security, logging
    models/          # SQLAlchemy models
    schemas/         # Pydantic schemas
    services/        # business logic (prediction, anomaly, alerts)
    ml/              # training scripts, model artifacts, feature pipeline
  tests/
  Dockerfile
frontend/
  src/
    api/             # axios client, typed API calls
    components/
    pages/
    hooks/
  tests/
.github/workflows/   # ci.yml, deploy.yml, scheduled-jobs.yml
docs/                # ADRs, data dictionary, system design doc
```

---

## PART 8 — SECURITY PLAN
- JWT auth on every mutating/admin endpoint; role-based access (`user`/`admin`).
- Input validation via Pydantic everywhere; parameterized queries only (SQLAlchemy ORM, no raw string SQL).
- Rate limiting per IP/user (slowapi + Redis).
- Secrets in environment variables only, `.env` gitignored, documented in `.env.example`.
- CORS locked to the deployed frontend origin.
- Dependabot enabled (free) for dependency vulnerability alerts.
- HTTPS enforced everywhere (Vercel/Render provide free TLS).

---

## PART 9 — TESTING STRATEGY
- Unit: services (prediction, anomaly detection, alert trigger logic).
- Integration: API endpoints against a test Postgres (Dockerized, spun up in CI).
- Frontend: component tests (RTL) + at least one Cypress/Playwright e2e happy path (search → predict → watchlist), both free OSS.
- Load test: Locust script documented with results in `docs/performance.md`.

---

## PART 10 — DEPLOYMENT STRATEGY
1. Local: `docker-compose up` (Postgres + Redis + API + frontend).
2. CI: GitHub Actions runs tests on every PR; blocks merge on failure.
3. CD: merge to `main` → Vercel auto-deploys frontend, Render/Fly deploy hook redeploys backend, GitHub Actions cron keeps backend warm and refreshes price data.
4. Rollback: Render/Vercel both support one-click rollback to previous deploy — document this in `docs/runbook.md`.

---

## PART 11 — RESUME TALKING POINTS
- "Built and deployed a full-stack flight dynamic-pricing platform (React/FastAPI/Postgres) with a real XGBoost model trained on 300K+ historical fares, achieving $X MAE."
- "Designed a $0-cost cloud architecture (Vercel/Render/Neon/Upstash) with CI/CD, automated testing, and 99%+ uptime monitoring via Sentry."
- "Implemented statistical anomaly detection on time-series flight pricing data, surfaced through a real-time alerting system."

## PART 12 — INTERVIEW TALKING POINTS
- Be ready to explain: training/serving skew and how the feature pipeline avoids it; why XGBoost over a neural net for tabular fare data; cold-start handling on free-tier hosting; how rate limiting protects the predict endpoint from abuse.

## PART 13 — SYSTEM DESIGN TALKING POINTS
- Trade-off: free-tier serverless Postgres (connection limits) vs. connection pooling (PgBouncer/Supabase pooler) — explain how you'd scale this with real budget (move to RDS + ElastiCache + SageMaker if funded).
- Explain the explicit boundary between "what's free-tier-shaped today" and "what changes at scale" — this is the single most senior-sounding thing you can say in an interview.

---

## PART 14 — STAFF ENGINEER RED TEAM

| Risk | Problem | Fix |
|---|---|---|
| **Bottleneck** | Free Postgres tiers cap connections (~20–60); FastAPI without pooling exhausts them under load | Use SQLAlchemy connection pool + Supabase/Neon's built-in pgbouncer pooler |
| **Failure point** | Render/Fly free dyno cold-starts (30–50s) make the demo look broken on first hit | Document it; add a `/health` keep-warm cron; show a loading skeleton, not a blank screen |
| **Failure point** | Single model file loaded in-process — a bad deploy with a corrupt pickle takes down `/predict` for everyone | Validate model artifact in CI before deploy; health check asserts a test prediction succeeds before traffic is routed |
| **Scalability** | Scheduled GitHub Actions cron is not a real streaming pipeline — can't claim "real-time" without caveat | Be explicit in docs about polling interval vs. true streaming; frame as "near-real-time, bounded by free API rate limits" |
| **Security risk** | JWT validation done ad hoc per route invites a missed-auth-check bug | Single `get_current_user` dependency injected everywhere; deny-by-default middleware for `/admin/*` |
| **Security risk** | Free email-sending tiers (100/day) can be abused for spam if alert creation isn't rate-limited per user | Cap watchlists/alerts per user; rate-limit alert-trigger endpoint |
| **Edge case** | Route with zero historical data breaks calendar/anomaly queries (div-by-zero, empty chart) | Explicit "insufficient data" UI state; backend returns 200 with empty-but-valid payload, never 500 |
| **Edge case** | Model prediction for an unseen route/date far outside training distribution | Add an out-of-distribution guard (feature range check) → return a flagged "low-confidence" prediction, not a silently wrong number |
| **Data integrity** | Scheduled job partially fails mid-write, corrupting a day's `price_history` | Wrap each job run in a DB transaction; write to a staging table and swap on success (idempotent upserts keyed on route+timestamp) |

---

## Bottom line
The honest, fundable-with-$0 version of this project is **smaller in surface area than the AWS fantasy, but entirely real**: one good dataset, one real model with measured accuracy, one deployed full-stack app with auth/DB/tests/CI, and 4–5 genuinely working Google-Flights-style features instead of 11 mockups. That is what gets called back for an interview.

---

## PART 15 — EXECUTION ROADMAP: How to actually build this, step by step

Rule for every phase: **nothing moves to the next phase until the current one is deployed and demoable**, not just coded locally. This forces the project to stay real instead of accumulating untested surface area.

### Phase 0 — Foundations (Day 0–1, before any feature code)
1. Create fresh GitHub repo (or restructure this one) — public, MIT license already exists, keep it.
2. Decide final stack: **FastAPI + PostgreSQL + SQLAlchemy + React** (already chosen in Part 4 — don't relitigate this).
3. Create free accounts now (all no-card-required free tiers): GitHub, Vercel, Render (or Fly.io), Neon or Supabase, Upstash, Sentry, Kaggle.
4. Write `docs/decisions/0001-architecture.md` (one paragraph: why FastAPI not Flask/Django, why Postgres not Mongo, why Vercel+Render not AWS). This is your first ADR — start the habit now, not at the end.
5. **Definition of done:** empty repo with `backend/`, `frontend/` (existing), `docs/`, a `README.md` stub, and all five free accounts created.

### Phase 1 — Real data + real model (Day 2–5)
1. Download one dataset: Kaggle "Flight Price Prediction" (fast, clean) — start here, add BTS data later if time allows.
2. EDA notebook in `backend/notebooks/eda.ipynb` — distributions, nulls, route frequency, price vs. days-to-departure.
3. Feature engineering function in `backend/app/ml/features.py` — this exact function will be reused at inference time (no duplicate logic between training and serving — this is the training/serving-skew fix from Part 14).
4. Train XGBoost in `backend/app/ml/train.py`, log run with MLflow (local SQLite store), save metrics (MAE, RMSE, R²) to `docs/model_card.md`.
5. Export `model.json`/`model.pkl` + a `model_version` string into `backend/app/ml/artifacts/`.
6. **Definition of done:** a committed model card with real numbers, e.g. "MAE = $42, R² = 0.81 on held-out test set," and a versioned model artifact in the repo.

### Phase 2 — Backend skeleton (Day 6–9)
1. Scaffold FastAPI app per the `app/api`, `app/core`, `app/models`, `app/schemas`, `app/services` structure in Part 7.
2. Postgres schema from Part 5 — write as Alembic migrations (don't hand-create tables; migrations are themselves a resume signal).
3. Implement `/health` and `/predict` first — `/predict` loads the Phase 1 model and calls the shared `features.py` function.
4. Add Pydantic request/response schemas, structured JSON logging, global exception handler (never leak stack traces to the client).
5. Write pytest tests for `/health` and `/predict` (happy path + out-of-range input).
6. **Definition of done:** `docker-compose up` locally serves a working `/predict` endpoint with a passing test suite.

### Phase 3 — Auth + core CRUD (Day 10–14)
1. Wire Supabase Auth (or Firebase Auth) — frontend signup/login, backend JWT verification dependency (`get_current_user`).
2. Implement `users`, `watchlists`, `saved_searches` tables + CRUD endpoints.
3. Add rate limiting (slowapi) to `/predict` and all mutating routes.
4. **Definition of done:** a real user can sign up, log in, save a search, and see it persist after logout/login.

### Phase 4 — Deploy early, deploy often (Day 15–16 — do not wait until "feature complete")
1. Push backend to Render/Fly, frontend to Vercel, connect both to Neon/Supabase Postgres and Upstash Redis.
2. Add GitHub Actions `ci.yml` (lint + test on every PR) immediately — retrofit it once, never skip it again.
3. Add a `/health`-ping GitHub Actions cron to fight cold starts.
4. **Definition of done:** a public URL exists and `/predict` + login work on it, even though most UI modules still show old mock data. This is the single most important milestone in the whole project — ship the thin slice live before building wide.

### Phase 5 — Real-data features (Day 17–25)
Build in this order, each shippable independently:
1. Scheduled price-polling job (GitHub Actions cron) → `price_history` table.
2. Fare calendar + cheapest-date finder (pure read queries over `price_history`).
3. Anomaly detection job (z-score/IQR) → `anomalies` table → real alert banners.
4. Price-drop email alerts (Resend/SendGrid free tier) wired to `watchlists`.
5. Route popularity / market analytics pages repointed from mock arrays to real aggregate queries.
6. **Definition of done:** every page that used to show `Math.random()` data now queries the real DB, or explicitly shows an "insufficient data yet" empty state (never silently fake numbers).

### Phase 6 — Polish for recruiters (Day 26–30)
1. SHAP explainability on the predict response + UI panel.
2. Admin dashboard wired to real `api_usage`/`audit_logs` tables.
3. OpenAPI docs reviewed and cleaned (FastAPI gives you this for free at `/docs` — just don't leave default descriptions).
4. Cypress/Playwright e2e happy-path test (search → predict → watchlist → alert).
5. Locust load test, results documented in `docs/performance.md`.
6. Rewrite `README.md`: live demo link at the top, real architecture diagram (Part 4), real screenshots, real metrics — delete the GitHub-stats/typing-SVG filler from the current README.
7. **Definition of done:** a stranger can open the README, click the live link, and verify every claim in under two minutes.

### How to sequence this if you have limited time
- If you only do **one** phase: do Phase 1 + the `/predict` half of Phase 2 — a real model beats everything else combined.
- If you only do **two**: add Phase 4 (deploy it) — "live and real" beats "complete and local."
- Everything in Phase 5/6 is depth, not a prerequisite for credibility — sequence them last and stop whenever your deadline hits; a smaller, fully-real V2 beats an unfinished, fully-scoped one.

### Immediate next action
Tell me which phase to start, and I will write the actual code (not just spec it) — e.g. "start Phase 1" gets you the dataset pulled, the EDA, and a real training script today.
