
# Fin Assistant — AI Personal Finance Web App (MongoDB + React + Node + Optional ML)

An end‑to‑end **intelligent personal finance assistant** that:
- **Automates expense classification** (rules + optional ML microservice).
- **Generates dynamic, user‑specific budgets** based on income, historic spend, and goals.
- **Delivers personalized guidance** via an **NLP‑powered chatbot** (local intents; optional ML for better understanding).

**Tech stack**
- Frontend: React (Vite), Plain CSS (uses your `style.css`), Chart.js.
- Backend: Node.js (Express), MongoDB (Mongoose). Works with MongoDB Compass/Atlas/local.
- Optional ML: Python (Flask, scikit‑learn) microservice for advanced text classification.
  - Node falls back to rules if ML service is offline.

---

## Quick Start

### 0) Prereqs
- Node.js 18+
- Python 3.9+ (only if using ML service)
- MongoDB running locally (or Atlas). You can view/manage with **MongoDB Compass**.

### 1) Backend
```bash
cd server
cp .env.example .env
# edit MONGODB_URI if needed (default is localhost)
npm i
npm run dev
```
The server runs at `http://localhost:4000`.

### 2) Optional ML Microservice
In a new terminal:
```bash
cd ml
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python ml_service.py
```
The ML service runs at `http://localhost:5001`.
> The Node server will automatically use it if `ML_SERVICE_URL` is set in `.env` (defaults to `http://localhost:5001`).

### 3) Frontend
In a new terminal:
```bash
cd frontend
npm i
npm run dev
```
Then open the URL Vite prints (usually `http://localhost:5173`).

---

## Features you can try

- **Add transactions** manually from *Dashboard → Quick Add*.
- **Auto classify** description/merchant with rules; turn on ML service for more accuracy.
- **UPI/SMS-like parsing**: paste a mock SMS (`Paid Rs. 249.00 to ZOMATO ...`) in the description — it’ll parse amount & merchant.
- **Dynamic Budgets**: set monthly income & goals → app proposes category caps from your history.
- **Reports**: category pie, monthly trend, payment mode stats.
- **Chatbot**: ask things like “How much did I spend on Food last month?”, “Can I save ₹10,000 this month?”, “What’s my safe daily spend?”, “Invest vs pay off debt?”

---

## Environment variables

`server/.env`:
```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/fin_assistant
JWT_SECRET=supersecret
ML_SERVICE_URL=http://localhost:5001
```

`ml/.env` (optional):
```
PORT=5001
```

---

## Notes
- Data lives in MongoDB; connect with **MongoDB Compass** at `mongodb://127.0.0.1:27017/fin_assistant`.
- All CSS comes from your uploaded `style.css` (in `frontend/public/style.css`).
- No Tailwind, no TypeScript.
- This project is intentionally compact so you can extend quickly (auth, bank APIs, OCR for receipts, etc.).
# Fin_assis

