# Stock Prediction & Portfolio Dashboard (NSE/BSE)

A full-stack application for Indian stock market tracking, portfolio management, sentiment-driven news analysis, and ML-powered price predictions.

## Features
- Real-time quotes from Yahoo Finance for NSE/BSE (`/api/stocks`)
- Real news sentiment via NewsAPI (configure `NEWS_API_KEY`) (`/api/news`)
- User authentication with JWT (`/api/auth`)
- Portfolio CRUD with P&L and live price valuation (`/api/portfolio`)
- End-to-end data collection, preprocessing, and LSTM-based price predictions (`/api/predictions`)
- WebSocket updates via Socket.IO

## Tech Stack
- Frontend: React, MUI, Axios, Recharts
- Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO, Yahoo Finance API
- Sentiment: `sentiment` + `natural` with financial term weighting
- ML: TensorFlow.js + optional Python LSTM trainers (`backend/ml_training`)

## Methodology
- Real data collection: historical and real-time quotes from Yahoo Finance; company and market news from NewsAPI.
- Preprocessing: cleaning, normalization/min–max scaling, time-series windowing (sequence creation), and feature selection for indicators.
- Sentiment scoring: tokenization, stemming, and finance-specific term/phrase weighting for robust article sentiment.
- LSTM modeling: sequence models implemented in Node (TensorFlow.js) and our trained Python pipelines; trained with sliding windows and validated with MSE/R².
- Inference: multi-day horizon forecasting with confidence intervals; results exposed via REST endpoints.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally or in the cloud
- Optional (ML): Python 3.9+ with `yfinance` and other deps

### 1) Backend
```bash
cd backend
npm install
# create .env and configure values (see Environment)
npm run dev   # development with auto-reload
# or
npm start     # production start
```
Server runs on `http://localhost:5001` by default (`backend/server.js`).

### 2) Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000`.

## Environment
Create `backend/.env` with:
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/stockprediction
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d

# NewsAPI for real articles and sentiment
NEWS_API_KEY=your_real_newsapi_key

# Models: We train our own LSTM models; no external providers
```
Notes:
- Do not commit `.env`. Ensure it’s in `.gitignore`.

## Real Data Sources
- Market quotes and historical data: Yahoo Finance
- Company and market news: NewsAPI

## API Endpoints
Base URL: `http://localhost:5001/api`

### Stocks
- `GET /stocks/:symbol?exchange=NSE|BSE`
  - Examples: `TCS.NS`, `TCS.BO`, `RELIANCE`
  - Exchange param formats symbol (default NSE). Returns Yahoo Finance quote.
- `GET /stocks/historical/:symbol?exchange=NSE|BSE`
  - Returns 1y daily candles from Yahoo Finance.

### News & Sentiment
- `GET /news` — General Indian market news via NewsAPI (configure `NEWS_API_KEY`)
- `GET /news/:symbol?exchange=NSE|BSE&days=7` — Company-focused articles with enhanced sentiment scoring
  - Implementation in `backend/routes/news.js` (loads env at `news.js:5`).

### Auth
- `POST /auth/signup` — `{ username, email, password }`
- `POST /auth/login` — `{ identifier, password }` (`identifier` = email or username)
- `GET /auth/me` — Bearer token required
  - See `backend/routes/auth.js:12-77`.

### Portfolio
- `GET /portfolio` — Requires Bearer token; returns portfolio
- `POST /portfolio` — Create/update item; `{ symbol, quantity, buyPrice, ... }`
- `DELETE /portfolio/:id` — Remove item
- `GET /portfolio/history` — Portfolio change history
  - See `backend/routes/portfolio.js:1-92`.

### Predictions
- `GET /predictions/:symbol?startDate=YYYY-MM-DD&exchange=NSE|BSE` — 7-day forecast
  - Tries LSTM (TensorFlow.js), falls back to trained Python models, then linear regression.
  - See `backend/routes/predictions.js:389-613`.
- `POST /predictions/train/:symbol` — Train LSTM and return predictions
- `GET /predictions/models` — List available trained models
- `GET /predictions/models/:symbol` — Model metadata
- `DELETE /predictions/models/:symbol` — Delete trained model
- `GET /predictions/lstm/:symbol?days=7` — Predict using trained LSTM only

## Frontend Usage
- Sign up and login; a JWT is stored and used for API calls
- Portfolio page fetches live prices to compute current value and P&L
- Sentiment Analysis page shows article list, labels, and charts
- Real-time updates appear on the dashboard via Socket.IO

## Development Tips
- Backend routes mounted in `backend/server.js:24-31`
- WebSocket initialization in `backend/server.js:10-23, 94-121, 144-159`
- NewsAPI usage and mock fallback in `backend/routes/news.js:117-121, 178-181`
- If news `url` points to `example.com`, you’re seeing mock data; set `NEWS_API_KEY`

## Optional ML (Python)
- Trainers and artifacts live in `backend/ml_training`
- Example dependency: `yfinance` (`backend/ml_training/lstm_trainer.py`)
- Create and activate a venv, then `pip install -r backend/ml_training/requirements.txt`

## License
Specify a license before publishing, or remove this section.