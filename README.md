# SignalAI — Stock & ETF Signal Generation Platform

> A full-stack platform that uses a global XGBoost model to generate BUY / HOLD / SELL signals for Indian stocks and ETFs. Built with Flask, React (Vite + TypeScript), and MongoDB.

---

## Overview

SignalAI trains a single unified ML model across hundreds of tickers (Nifty 500 + core stocks) and exposes predictions through a REST API. A React SPA provides dashboards for signals, backtesting, portfolio analytics, alerts, and live market data.\

https://developmentof-python-based-stock-et.vercel.app/

**Tech stack:**

| Layer | Technology |
|---|---|
| ML / Backend | Python 3.10+, XGBoost, scikit-learn, yfinance, Flask |
| Database | MongoDB |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Auth | JWT |

---

## Project Structure

```
├── backend/
│   ├── app.py                    # Flask entry point
│   ├── train_global_model.py     # Model training script
│   ├── requirements.txt
│   ├── models/                   # Saved model artifacts
│   │   ├── global_model.pkl
│   │   ├── global_scaler.pkl
│   │   └── global_features.pkl
│   ├── routes/                   # Flask route blueprints
│   ├── services/
│   │   ├── data_fetcher.py       # yfinance fetching with .NS/.BO fallbacks
│   │   └── ...
│   └── database.py               # MongoDB connection & collections
│
└── front_end/
    ├── src/
    │   ├── App.tsx
    │   └── pages/                # Dashboard, SignalEngine, Backtesting, etc.
    └── package.json
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- MongoDB (local instance or Atlas URI)

---

## Setup & Run

### 1. Backend

```bash
# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

Create a `.env` file in the repo root (optional — defaults are provided):

```env
MONGO_URI=mongodb://localhost:27017/    # MongoDB connection string
JWT_SECRET=your_secret_here            # JWT signing secret
```

Start the Flask server:

```bash
python backend/app.py
# Runs at http://127.0.0.1:5000
```

### 2. Frontend

```bash
cd front_end
npm install
npm run dev
# Runs at http://localhost:5173 (or as printed by Vite)
```

---

## Model Training

Pre-trained artifacts are included in `backend/models/`. To retrain from scratch:

```bash
python backend/train_global_model.py
```

This downloads historical data for Nifty 500 + core tickers, engineers features, trains a global XGBoost classifier, and saves three artifacts:

| File | Description |
|---|---|
| `global_model.pkl` | Trained XGBoost classifier |
| `global_scaler.pkl` | Feature scaler |
| `global_features.pkl` | Feature column names |

> **Note:** Training downloads data for many tickers and can take significant time. Rate-limit protection for yfinance is built in.

Labels are generated from next-day return thresholds:
- **BUY** — return above upper threshold
- **HOLD** — return within neutral band
- **SELL** — return below lower threshold

---

## API Reference

Base URL: `http://127.0.0.1:5000`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check & available endpoints |
| GET | `/stocks` | List of available tickers (Nifty 500 + core) |
| GET | `/predict/<ticker>?email=<email>` | BUY/HOLD/SELL signal + confidence + latest price |
| GET | `/api/market/overview` | Price, change %, market cap for core Indian tickers |
| POST | `/api/backtest` | Run RSI strategy backtest (see body below) |
| POST | `/api/alerts` | Create a price alert |
| GET | `/api/alerts?email=<email>` | List user's active alerts |
| DELETE | `/api/alerts/<id>` | Remove an alert |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive a JWT token |
| POST | `/api/user` | Update user profile (name) |

### Backtest request body

```json
{
  "startDate": "2020-01-01",
  "endDate":   "2024-01-01",
  "initialCapital": 100000
}
```

The backend runs an RSI Mean Reversion strategy against the requested date range using yfinance data.

---

## Features

- **ML Signal Engine** — enter any NSE ticker and receive a BUY / HOLD / SELL signal with confidence score, powered by the global XGBoost model.
- **Backtesting** — test the RSI strategy against historical data over any date range with performance metrics (Sharpe ratio, max drawdown, win rate, CAGR).
- **Portfolio Analytics** — overview of positions and P&L.
- **Alerts** — set price-level alerts; a background daemon thread checks conditions every 30 seconds and writes notifications to MongoDB.
- **Market Data** — live table of Nifty large-cap stocks with price, change %, volume, market cap, P/E, and sector.
- **Authentication** — register / login with JWT; user profile stored in MongoDB.

---

## Data Source

All market data is fetched via **yfinance** (Yahoo Finance). No API key is required. The fetcher automatically appends `.NS` or `.BO` suffixes for Indian tickers and falls back to `yf.download` if the primary method fails.

> In production, consider a paid data provider or a caching proxy to avoid Yahoo Finance rate limits.

---



## License

This project is a demo / proof-of-concept. See [license.txt](license.txt).




