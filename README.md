# Development of Python-Based Stock & ETF Signal Generation Platform

This repository contains a full-stack proof-of-concept platform for generating trading signals for stocks and ETFs using a global XGBoost model, a Flask backend, and a React + Vite frontend.

**Key ideas:** use a single, unified model trained across many tickers to produce BUY / HOLD / SELL signals, provide REST APIs for predictions, alerts, backtesting and a modern SPA dashboard.

**Contents:**

- **backend/**: Flask API, services (data fetching, feature engineering, prediction), model training and saved models.
- **front_end/**: Vite + React (TypeScript) single-page app for UI and dashboards.

**Requirements summary:**

- Python 3.10+ for backend
- Node 18+ / npm or pnpm for frontend
- MongoDB for persistence (or a local MongoDB instance for development)

**Quick links:**

- Backend entry: [backend/app.py](backend/app.py)
- Model training: [backend/train_global_model.py](backend/train_global_model.py)
- Frontend app: [front_end/src/App.tsx](front_end/src/App.tsx)
- Saved models: [backend/models](backend/models) (contains pre-saved global_model.pkl, global_scaler.pkl, global_features.pkl)

**Features**

- REST API endpoints for: authentication, user profile, market overview, prediction (/predict/<ticker>), backtesting, alerts and notifications.
- Background alert-checker thread that monitors active alerts and saves notifications.
- Model training script that downloads historical data, computes features, trains an XGBoost classifier, and saves model artifacts.
- Frontend SPA with pages for dashboard, signals, backtesting, alerts, market overview and account settings.

## Setup & Run

**1) Backend (Python)**

- Install dependencies:
  - Create a virtual environment and activate it

  - Install requirements from [backend/requirements.txt](backend/requirements.txt)

  ```bash
  python -m venv .venv
  # Windows
  .venv\Scripts\activate
  # macOS / Linux
  source .venv/bin/activate
  pip install -r backend/requirements.txt
  ```

- Environment variables:
  - Create a `.env` file or export variables used by [backend/database.py](backend/database.py):
    - `MONGO_URI` — MongoDB connection string (if not set, code falls back to mongodb://localhost:27017/).
    - `JWT_SECRET` — optional secret for JWT tokens (default is provided in code).

- Run backend server (from repo root):

```bash
# from repo root
python backend/app.py
```

This starts the Flask server at http://127.0.0.1:5000 by default.

**2) Frontend (Vite + React)**

- Install and start frontend:

```bash
cd front_end
npm install
npm run dev
```

Open the dev site (Vite will print the local URL, typically http://localhost:5173).

## Model training & artifacts

- Pretrained model artifacts (if present) are stored in [backend/models](backend/models): `global_model.pkl`, `global_scaler.pkl`, `global_features.pkl`.
- To retrain the global model from scratch, run the trainer:

```bash
python backend/train_global_model.py
```

Notes: training will download historical data for many tickers (can take significant time and API rate-limit protection may be needed). The trainer uses the same feature engineering used at inference.

## API Overview (selected endpoints)

- Root: GET `/` — basic health and available endpoints ([backend/app.py](backend/app.py)).
- Stocks list: GET `/stocks` — returns list of tickers available (Nifty 500 + core tickers).
- Predict: GET `/predict/<ticker>?email=<email>` — returns signal, confidence, latest_price and optionally stores a recent search under the provided email.
- Market overview: GET `/api/market/overview` — returns core Indian tickers info (price, change, market cap).
- Backtest: POST `/api/backtest` — run a simple SMA crossover backtest; request body expects `startDate`, `endDate`, `initialCapital`.
- Alerts: CRUD endpoints under `/api/alerts` to create, list and remove user alerts; background checker posts notifications to DB.
- Auth: `/api/auth/register` and `/api/auth/login` to create accounts and obtain JWT tokens.

For full route definitions, see the route files under [backend/routes](backend/routes).

## Development notes & assumptions

- The backend uses `yfinance` for data. In production you may prefer a paid data provider or caching proxy to avoid rate-limits.
- The training uses a multi-ticker aggregated dataset; labels are next-day return thresholds (BUY/HOLD/SELL).
- The alert checker runs in a daemon thread every 30 seconds; this is suitable for demos but a production system should use a scheduler or serverless events.
- MongoDB is used for users, alerts and notifications. Collections are defined in [backend/database.py](backend/database.py).

## Tests

- There are several small test scripts at the repo root and under `backend/` (e.g., `test_fetch.py`, `test_predictor.py`). These are ad-hoc scripts — run them individually with the appropriate environment.

## Troubleshooting

- If model artifacts are missing, the backend will warn and prediction endpoints will error — run the trainer first or place model files in [backend/models](backend/models).
- If Yahoo Finance fails to fetch a ticker, the code attempts several fallbacks (append `.NS` / `.BO` or use `yf.download`). See [backend/services/data_fetcher.py](backend/services/data_fetcher.py).

## Next steps / suggestions

- Add Dockerfiles for reproducible local development for backend and frontend.
- Add CI (tests + lint) and a workflow to build frontend production assets.
- Add rate-limit / retry policies for `yfinance` calls and consider caching expensive responses.

## License & Credits

This project is a demo/proof-of-concept. See the repository license file: [license.txt](license.txt).

If you prefer a different license (MIT, Apache-2.0, etc.) 

