# MediTwin — Project Report

Digital Twin for Predictive Healthcare (Semester 4 Project)

## 1. Overview

MediTwin combines real-time vital sign monitoring with machine learning to act as an early-warning system and health companion. Three independent services:

| Service | Tech | Port |
|---|---|---|
| Frontend | React 19 + Vite + TailwindCSS + TanStack Router/Query + Recharts | 5173 |
| Django Backend | Django 6 + DRF + SimpleJWT + XGBoost + ReportLab | 8000 |
| Real-Time Server | Node.js + Express 5 + Socket.IO | 4000 |
| Database | MongoDB (accessed via PyMongo, no ORM) | 27017 |

## 2. CORS Configuration

CORS exists because the frontend, Django API, and realtime server run on three different origins/ports, and browsers block cross-origin requests without explicit permission.

### Django Backend (`settings.py`)
- `CORS_ALLOW_ALL_ORIGINS` — env-driven, default `False`
- `CORS_ALLOWED_ORIGINS` — allowlist from env, defaults to `localhost:3000/5173`
- `CORS_ALLOW_CREDENTIALS = True` — allows auth cookies/JWT headers across origins
- Production-tightened (allowlist based)

### Socket.IO Server (`server.js`)
- `origin: "*"` + `app.use(cors())` — open to all origins
- Dev convenience; should be restricted to the frontend domain before production

## 3. ML Model Metrics

Trained via `ml_engine/training/train_models.py` on **synthetic data** (1000 rows, seed 42), XGBClassifier (200 estimators, depth 4, lr 0.05). 80/20 stratified split, evaluated on 200 holdout rows.

| Model | Accuracy | ROC-AUC | F1 |
|---|---|---|---|
| diabetes | 0.810 | 0.864 | 0.703 |
| heart_disease | 0.810 | 0.885 | 0.725 |
| hypertension | 0.775 | 0.850 | 0.767 |

Positive rates (imbalanced): diabetes 32.8%, heart_disease 37.3%, hypertension 49.0%.

**Caveats:**
- Metrics measure the model learning a hand-crafted synthetic label rule, not real-world risk.
- F1 is the honest metric; accuracy flatters on imbalanced data.
- Metrics are printed to stdout at training time and **not persisted** anywhere — regenerate by running the training script.
- The predictor (`predictor.py`) tries the `.pkl` models first and silently falls back to rule-based scoring when models are missing — there is no way for a user to know which path produced their score.
- Cascade effects (`predictor.py:201`) add hand-written 10–18% boosts on top of model output.

## 4. Sample Interview Questions

### Architecture
- Why three separate services instead of one Django app serving the frontend?
- Both Django and Node share MongoDB and `JWT_SECRET` — walk through the cross-service token flow.
- Why PyMongo directly instead of the Django ORM?

### Security
- The Socket.IO server sets `origin: "*"` — what's the risk, how would you lock it down?
- Where is the JWT actually verified in the realtime server? (It matches Django's `SECRET_KEY`.)
- The chatbot calls a local Ollama at `localhost:11434` with no auth — attack surface?
- The `predict`/`what_if` endpoints accept arbitrary numbers — what validation prevents `age: -100`?

### ML
- Which path actually runs in the demo: ML models or rule-based fallback? How would a user know?
- How were models validated, and what do accuracy/F1 actually mean here given synthetic data?
- Where did the risk-level thresholds (`>=0.75` = critical) come from?

### Realtime / Production
- Vitals are `Math.random()` simulations — what's the production data source?
- If a socket reconnects, is the old vitals interval cleared before a new one starts?
- The in-memory `connectedUsers`/`userSockets` Maps break with two Node instances — what replaces them?

## 5. Identified Weaknesses

1. Realtime CORS wide open (`origin: "*"`).
2. No JWT verification code found in the realtime server despite `JWT_SECRET` env var.
3. No input validation on ML endpoints (negative/absurd values accepted).
4. Silent ML→rule fallback — users can't tell which engine scored them.
5. Metrics not persisted; trained models not committed.
6. Chatbot "confidence" is hardcoded fake (`qa_engine.py:54`).
7. Tests out of sync with predictor (reference `cardiovascular`/`kidney_disease` keys that don't exist).
