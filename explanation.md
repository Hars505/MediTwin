# MediTwin — Complete Project Explanation

> **MediTwin** is an AI-Powered Digital Twin platform for Predictive Healthcare.  
> It creates a living digital replica of a patient's health by combining real-time vital sign monitoring with machine learning predictive models, acting as an early-warning system and health companion for patients and clinicians alike.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Feature-by-Feature Breakdown](#3-feature-by-feature-breakdown)
   - 3.1 [User Authentication & Role System](#31-user-authentication--role-system)
   - 3.2 [Patient Onboarding](#32-patient-onboarding)
   - 3.3 [Digital Twin Dashboard](#33-digital-twin-dashboard)
   - 3.4 [Real-Time Vitals Monitoring](#34-real-time-vitals-monitoring)
   - 3.5 [ML Risk Prediction Engine](#35-ml-risk-prediction-engine)
   - 3.6 [What-If Lifestyle Simulator](#36-what-if-lifestyle-simulator)
   - 3.7 [Medical AI Chatbot (MediBot)](#37-medical-ai-chatbot-medibot)
   - 3.8 [Clinical Decision Support (CDS) Alerts](#38-clinical-decision-support-cds-alerts)
   - 3.9 [PDF Health Reports](#39-pdf-health-reports)
   - 3.10 [Doctor Portal](#310-doctor-portal)
   - 3.11 [Lifestyle Recommendations](#311-lifestyle-recommendations)
   - 3.12 [Notification System](#312-notification-system)
4. [Python / Django Backend — Explained](#4-python--django-backend--explained)
5. [Machine Learning Pipeline — Explained](#5-machine-learning-pipeline--explained)
6. [Frontend (React) — Explained](#6-frontend-react--explained)
7. [Real-Time Server (Node.js) — Explained](#7-real-time-server-nodejs--explained)
8. [Database (MongoDB) — Explained](#8-database-mongodb--explained)
9. [Advantages](#9-advantages)
10. [Disadvantages](#10-disadvantages)
11. [Future Scope](#11-future-scope)

---


### What Problem Does It Solve?

Traditional healthcare is **reactive** — patients visit doctors only after symptoms appear. MediTwin shifts this paradigm to **proactive healthcare** by:

- Continuously monitoring vitals (Heart Rate, Blood Pressure, SpO2, Blood Glucose, Temperature)
- Using ML models to predict disease risk **before** symptoms manifest
- Alerting patients and doctors when vital signs deviate from safe ranges
- Providing a "What-If" simulator so patients can see how lifestyle changes affect their health risk

### Who Is It For?

| User Role | Use Case |
|-----------|----------|
| **Patient** | View their digital twin, monitor vitals, chat with the AI, generate health reports |
| **Doctor** | Monitor assigned patients, review risk profiles, receive CDS alerts |
| **Admin** | Manage users, view ML model performance metrics |

---

## 2. System Architecture

MediTwin follows a **microservices-inspired architecture** with three independent services:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│            React 19 + TailwindCSS + Shadcn/UI + Recharts             │
└──────────┬───────────────────────────────────┬───────────────────────┘
           │  REST API (HTTP)                  │  WebSocket (Socket.IO)
           ▼                                   ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│   Django REST Backend    │    │  Node.js Real-Time Server    │
│   ─────────────────────  │    │  ────────────────────────    │
│   • Auth (JWT)           │    │  • Socket.IO Engine          │
│   • Patient Management   │◄──►│  • Live Vitals Streaming     │
│   • ML Engine            │    │  • JWT Verification          │
│   • Clinical Rules (CDS) │    │  • Anomaly Detection         │
│   • Chatbot (NLP)        │    │                              │
│   • PDF Report Gen       │    │                              │
└──────────┬───────────────┘    └──────────────┬───────────────┘
           │              Shared MongoDB              │
           ▼                                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        MongoDB (NoSQL)                               │
│     users • patients • vitals • health_profiles • reports • qa_pairs │
└──────────────────────────────────────────────────────────────────────┘
```

### How the Three Services Communicate

1. **Frontend ↔ Django Backend** → Standard REST API calls over HTTP using JWT tokens for authentication.
2. **Frontend ↔ Node.js Server** → Persistent WebSocket connections via Socket.IO for real-time data streaming.
3. **Django ↔ Node.js** → Both services share the same MongoDB database, so data written by one service is readable by the other.

---

## 3. Feature-by-Feature Breakdown

### 3.1 User Authentication & Role System

| Aspect | Details |
|--------|---------|
| **What it does** | Users can register as a Patient, Doctor, or Admin. Login returns JWT tokens (access + refresh) for session management. |
| **Use** | Secures all API endpoints. Only authenticated users can access dashboards, vitals, and reports. |
| **How it works** | Django's `AbstractUser` model is extended with a `Role` field (patient/doctor/admin). `djangorestframework-simplejwt` handles JWT token generation. Rate-limiting prevents brute-force attacks. |
| **Frontend files** | `login.jsx`, `register.jsx` |
| **Backend files** | `accounts/models.py`, `accounts/views.py`, `accounts/serializers.py` |

**Advantage:** Stateless JWT authentication scales well and works across all three services (Django, Node.js, Frontend).  
**Disadvantage:** JWT tokens can't be revoked server-side without a blacklist (not implemented). If a token is stolen, it remains valid until expiry.

---

### 3.2 Patient Onboarding

| Aspect | Details |
|--------|---------|
| **What it does** | A multi-step guided form that collects the patient's medical history, demographics (age, height, weight, blood type), lifestyle habits (smoking, alcohol, exercise), family history, allergies, and current medications. |
| **Use** | This data forms the baseline for the digital twin. Without it, the ML models cannot compute risk predictions. |
| **How it works** | The React form (`onboarding.jsx`) posts the data to `/api/patient/profile/`. Django validates it with `HealthProfileSerializer` and stores it in MongoDB's `health_profiles` collection. BMI is calculated automatically. |
| **Frontend files** | `onboarding.jsx` |
| **Backend files** | `patients/views.py` → `HealthProfileView`, `patients/serializers.py`, `patients/mongo_models.py` |

**Advantage:** Comprehensive onboarding enables personalized ML predictions based on each patient's unique profile.  
**Disadvantage:** Requires manual data entry by the patient; there's no integration with EHR (Electronic Health Record) systems for auto-population.

---

### 3.3 Digital Twin Dashboard

| Aspect | Details |
|--------|---------|
| **What it does** | The central hub that displays the patient's full digital twin — real-time vitals, ML risk scores, SHAP-style explanations of what's driving each risk, cascade effects, and clinical alerts. |
| **Use** | Gives the patient (and doctor) a single-screen overview of their complete health status. |
| **How it works** | On page load, the dashboard calls two APIs: (1) `/api/patient/vitals/latest/` for current vitals, and (2) `/api/ml/risk-scores/` for the latest ML predictions. It renders everything using Recharts for data visualization, color-coded risk cards (green/amber/red), and animated progress bars. |
| **Frontend files** | `dashboard.jsx`, `twin.jsx` |
| **Backend files** | `patients/views.py`, `ml_engine/views.py` |

**Advantage:** Consolidates all health data into one intuitive view with visual risk indicators.  
**Disadvantage:** Dashboard complexity means slower load times if API responses are delayed. Relies on browser-only rendering (no SSR for SEO).

---

### 3.4 Real-Time Vitals Monitoring

| Aspect | Details |
|--------|---------|
| **What it does** | Streams live vital signs (heart rate, blood pressure, SpO2, blood glucose, temperature, respiratory rate) to the dashboard every 2 seconds via WebSocket. |
| **Use** | Simulates continuous patient monitoring as if connected to wearable devices or hospital sensors. Detects anomalies in real-time and pushes alerts to the UI. |
| **How it works** | The **Node.js real-time server** (`realtime_server/server.js`) uses **Socket.IO** to maintain persistent WebSocket connections. After a client authenticates (sends a `userId`), the server starts a `setInterval` loop that generates simulated vitals data every 2 seconds and emits `vitals:update` events. A threshold-based anomaly detector checks each reading against medical ranges and emits `vitals:anomaly` events when values are out of range. |

**Vitals monitored and their normal ranges:**

| Vital Sign | Normal Range | Anomaly Trigger |
|------------|-------------|-----------------|
| Heart Rate | 60–100 bpm | < 60 or > 100 |
| Systolic BP | 90–140 mmHg | < 90 or > 140 |
| Diastolic BP | 60–90 mmHg | < 60 or > 90 |
| SpO2 | 95–100% | < 95% |
| Blood Glucose | 70–140 mg/dL | < 70 or > 140 |
| Temperature | 36.5–37.5°C | < 36.5 or > 37.5 |
| Respiratory Rate | 12–20 breaths/min | < 12 or > 20 |

**Advantage:** Real-time streaming gives a "live" feel to the digital twin. Anomalies are detected and flagged instantly.  
**Disadvantage:** Currently uses **simulated data** (random generation), not real device data. In production, this would need integration with IoT/wearable APIs. The in-memory `Map` for user sessions doesn't scale across multiple server instances — would need Redis.

---

### 3.5 ML Risk Prediction Engine

| Aspect | Details |
|--------|---------|
| **What it does** | Predicts the patient's risk probability for **Diabetes**, **Heart Disease (CVD)**, and **Hypertension** using ensemble machine learning models. |
| **Use** | Enables proactive healthcare — patients and doctors can see disease risks before symptoms appear. |
| **How it works** | See the [detailed ML section below](#5-machine-learning-pipeline--explained). |

**Advantage:** Multi-condition ensemble prediction with cascade effects and SHAP-style explainability.  
**Disadvantage:** Trained on synthetic data (not real clinical datasets), so predictions are for demonstration purposes only.

---

### 3.6 What-If Lifestyle Simulator

| Aspect | Details |
|--------|---------|
| **What it does** | Interactive sliders let users hypothetically adjust their lifestyle parameters (e.g., "What if I lose 5 kg?", "What if I quit smoking?", "What if my blood glucose drops by 20 mg/dL?") and instantly see how these changes would shift their predicted disease risk. |
| **Use** | Motivates patients to make healthy lifestyle changes by showing the tangible impact on their risk scores. |
| **How it works** | The frontend (`whatif.jsx`) sends adjustment parameters to `POST /api/ml/what-if/`. The backend creates a **deep copy** of the patient's profile, applies the adjustments, and recalculates risk scores using `calculate_risk_scores()`. Both current and simulated scores are returned for side-by-side comparison. |

**Example API call:**
```json
{
  "adjustments": {
    "bmi": -3,
    "blood_glucose": -20,
    "smoking": false
  }
}
```

**Advantage:** Highly engaging and educational. Patients can see measurable results of lifestyle improvements.  
**Disadvantage:** Simulations are hypothetical projections, not clinically validated predictions. Patients may over-rely on them.

---

### 3.7 Medical AI Chatbot (MediBot)

| Aspect | Details |
|--------|---------|
| **What it does** | A conversational AI assistant where patients can ask medical questions (e.g., "What are the symptoms of diabetes?", "Is chest pain serious?"). |
| **Use** | Provides 24/7 medical information triage without needing a doctor appointment for simple queries. |
| **How it works** | Uses a **local Ollama server** running the `medllama2` model for generative medical responses. The backend (`chatbot/qa_engine.py`) sends the user's question to Ollama's API (`http://localhost:11434/api/generate`) with a medical system prompt. Simple greetings are intercepted and handled locally. The chatbot also extracts symptom keywords from the conversation and logs them for the patient's symptom history. |

**Chatbot features:**
- **Session management** — Conversations are grouped into sessions stored in MongoDB
- **Symptom extraction** — Detects 26+ symptom keywords (chest pain, fever, headache, etc.) from user messages and logs them
- **Symptom memory** — Aggregates previously reported symptoms for longitudinal tracking
- **Conversation history** — Stores and retrieves past sessions

**Advantage:** Always available, can handle a wide range of medical queries. Symptom tracking builds a longitudinal health picture.  
**Disadvantage:** Requires Ollama to be running locally with the `medllama2` model installed. Generative AI can produce inaccurate medical information (hallucinations). Not a substitute for real medical advice.

---

### 3.8 Clinical Decision Support (CDS) Alerts

| Aspect | Details |
|--------|---------|
| **What it does** | Evaluates the patient's vitals and ML risk scores against **standard clinical guidelines** (AHA/ACC for blood pressure, ADA for diabetes, BTS for oxygen, ACLS for heart rate) and generates actionable alerts. |
| **Use** | Assists doctors by flagging critical conditions and providing evidence-based recommendations. |
| **How it works** | The `clinical_rules.py` engine checks vitals against thresholds defined by medical guidelines and generates structured alerts with severity (info/warning/critical), recommendations, and references. |

**Example alerts generated:**

| Condition | Threshold | Severity | Recommendation |
|-----------|-----------|----------|----------------|
| Hypertensive Crisis | BP ≥ 180/120 | **Critical** | Immediate IV antihypertensives |
| Stage 2 Hypertension | BP ≥ 140/90 | Warning | ACE inhibitors, lifestyle mods |
| Severe Hyperglycemia | Glucose > 250 | **Critical** | Check for DKA/HHS, adjust insulin |
| Hypoglycemia | Glucose < 70 | **Critical** | Fast-acting carbohydrates |
| Hypoxemia | SpO2 < 92% | **Critical** | Supplemental oxygen therapy |
| Tachycardia | HR > 120 | Warning | ECG for arrhythmias |
| Bradycardia | HR < 50 | Warning | Review beta-blockers |
| High Diabetes Risk | ML prob > 40% | Warning | Order HbA1c, lifestyle counseling |
| High CVD Risk | ML prob > 30% | Warning | Calculate 10-year ASCVD risk |

**Advantage:** Evidence-based alerts grounded in real clinical guidelines (AHA, ADA, ACLS). Helps bridge the gap between raw data and clinical action.  
**Disadvantage:** Rule-based system — doesn't learn from new data. Thresholds are static and don't account for individual patient baselines.

---

### 3.9 PDF Health Reports

| Aspect | Details |
|--------|---------|
| **What it does** | Generates a professional, downloadable PDF health report containing the patient's demographics, risk assessment, recent vitals, and clinical recommendations. |
| **Use** | Patients can download and take the report to their doctor for informed consultations. |
| **How it works** | The `reports/generator.py` uses **ReportLab** to programmatically build a clinical-style PDF with custom headers/footers, color-coded risk tables, and vitals history. The PDF includes a disclaimer that it is for informational purposes only. |

**PDF sections include:**
1. Patient Demographics (age, gender, BMI, blood type, etc.)
2. Risk Assessment table with color-coded risk levels (green → red)
3. Recent Vitals history (last 10 readings)
4. Reference ranges for all vital signs

**Advantage:** Professional-grade clinical reports ready for doctor visits. One-click generation.  
**Disadvantage:** Static PDF — no interactive elements. Cannot be updated after generation.

---

### 3.10 Doctor Portal

| Aspect | Details |
|--------|---------|
| **What it does** | A dedicated interface where doctors can view all their patients, see each patient's profile, latest vitals, risk scores, and CDS alerts. |
| **Use** | Enables clinicians to monitor multiple patients from a single dashboard. |
| **How it works** | The `DoctorPatientsView` in `accounts/views.py` queries all patients with completed onboarding, fetches their profiles, vitals, risks, and CDS alerts, and returns a comprehensive JSON payload. The frontend (`doctor.jsx`) renders this as a patient list with expandable clinical details. |

**Advantage:** Centralized patient monitoring for clinicians. Includes CDS alerts for decision support.  
**Disadvantage:** Currently shows all patients to all doctors (no patient-doctor assignment). No HIPAA-compliant access control.

---

### 3.11 Lifestyle Recommendations

| Aspect | Details |
|--------|---------|
| **What it does** | Provides personalized lifestyle improvement suggestions based on the patient's risk factors (diet, exercise, stress management, sleep). |
| **Use** | Actionable guidance for patients to reduce their disease risk. |
| **Frontend files** | `lifestyle.jsx` |

**Advantage:** Bridges the gap between risk prediction and actionable advice.  
**Disadvantage:** Recommendations are template-based, not dynamically generated by AI.

---

### 3.12 Notification System

| Aspect | Details |
|--------|---------|
| **What it does** | In-app notifications for anomaly alerts, risk score changes, and system events. Users can mark notifications as read individually or all at once. |
| **How it works** | Notifications are stored in MongoDB and served via REST API. The frontend polls or receives them and displays them in a notification panel. |

**Advantage:** Keeps users informed without requiring them to actively check the dashboard.  
**Disadvantage:** No push notifications (email/SMS). Only in-app alerts.

---

## 4. Python / Django Backend — Explained

### Overview

The Python backend is the **core brain** of MediTwin. It is built with **Django 6.0** and **Django REST Framework (DRF)** and handles:

- Authentication (JWT)
- Patient data management
- Machine learning predictions
- Clinical decision support
- Chatbot logic
- PDF report generation

### Technology Stack

| Library | Version | Purpose |
|---------|---------|---------|
| `Django` | 6.0 | Web framework and ORM for user management |
| `djangorestframework` | 3.14+ | RESTful API layer with serializers, views, throttling |
| `djangorestframework-simplejwt` | 5.3+ | JWT token-based authentication |
| `django-cors-headers` | 4.3+ | Cross-Origin Resource Sharing for frontend |
| `pymongo` | 4.6+ | Direct MongoDB driver (bypasses Django ORM for health data) |
| `django-mongodb-backend` | 6.0 | Django's native MongoDB backend for user model |
| `pandas` | 2.0+ | Data manipulation for ML training |
| `numpy` | 1.24+ | Numerical computations |
| `scikit-learn` | 1.3+ | ML metrics and evaluation tools |
| `xgboost` | 1.7+ | Gradient boosting classifier for disease prediction |
| `reportlab` | 4.0+ | PDF document generation |
| `datasets` | 2.14+ | HuggingFace Datasets for loading medical QA data |
| `Pillow` | 10.0+ | Image processing support |
| `requests` | 2.31+ | HTTP client for Ollama API calls |

### Django App Structure

The backend is organized into **5 Django apps**, each handling a specific domain:

```
meditwin/medi_Twin/
├── accounts/          ← User auth, registration, JWT, doctor profiles
├── patients/          ← Health profiles, vitals CRUD, lifestyle logs
├── ml_engine/         ← ML models, clinical rules, risk prediction
├── chatbot/           ← NLP chatbot & medical Q&A engine
├── reports/           ← PDF clinical report generation
└── medi_Twin/         ← Project settings, URL routing, MongoDB config
```

#### 4.1 `accounts/` App

**Purpose:** User authentication and role-based access control.

- **`models.py`** — Extends Django's `AbstractUser` with:
  - `role` field: `patient` | `doctor` | `admin`
  - `phone`, `date_of_birth`, `gender` fields
  - `onboarding_complete` boolean flag
  - Helper properties: `is_patient`, `is_doctor`, `is_admin_user`

- **`views.py`** — Provides endpoints for:
  - `RegisterView` — User registration with immediate JWT token generation
  - `ProfileView` — GET/PUT user profile
  - `ChangePasswordView` — Secure password change
  - `DoctorProfileView` — Doctor-specific profile management
  - `DoctorPatientsView` — Lists all patients with their vitals, risks, and CDS alerts
  - `NotificationsView` — In-app notification management

- **`serializers.py`** — DRF serializers for input validation and output formatting

- **`mongo_models.py`** — MongoDB CRUD operations for doctor profiles, audit logs, and notifications

#### 4.2 `patients/` App

**Purpose:** Patient health data management.

- **`views.py`** — Endpoints for:
  - `HealthProfileView` — Create/retrieve health profile (demographics, lifestyle, medical history)
  - `VitalsView` — Record and retrieve vital sign measurements
  - `LatestVitalsView` — Get the most recent vitals snapshot
  - `LifestyleLogView` — Log lifestyle activities (meals, exercise, sleep)

- **`serializers.py`** — Validates vitals data (ensures heart rate is 20–300, BP is 40–300, etc.)

- **`mongo_models.py`** — MongoDB operations for `health_profiles`, `vitals`, and `lifestyle_logs` collections

#### 4.3 `ml_engine/` App

**Purpose:** Machine learning risk prediction and clinical alerts.

- **`predictor.py`** — Core prediction pipeline (see [ML section](#5-machine-learning-pipeline--explained))
- **`clinical_rules.py`** — CDS rule engine based on AHA/ADA guidelines
- **`training/train_models.py`** — Model training script using XGBoost
- **`views.py`** — API endpoints for risk scores, What-If simulation, model metrics

#### 4.4 `chatbot/` App

**Purpose:** Medical AI assistant.

- **`qa_engine.py`** — Generative response engine using Ollama's medllama2 model
- **`load_dataset.py`** — Loads 1.7M medical Q&A pairs from HuggingFace into MongoDB
- **`views.py`** — Session management, message handling, symptom extraction

#### 4.5 `reports/` App

**Purpose:** PDF report generation.

- **`generator.py`** — ReportLab-based PDF builder with clinical styling, color-coded tables, headers/footers

### API Endpoint Summary

| Endpoint | Method | App | Description |
|----------|--------|-----|-------------|
| `/api/auth/register/` | POST | accounts | Register new user |
| `/api/auth/login/` | POST | accounts | JWT login |
| `/api/auth/token/refresh/` | POST | accounts | Refresh JWT |
| `/api/auth/profile/` | GET/PUT | accounts | User profile |
| `/api/auth/doctor-profile/` | GET/PUT | accounts | Doctor profile |
| `/api/auth/doctors/` | GET | accounts | List all doctors |
| `/api/auth/doctor-patients/` | GET | accounts | All patients (doctor only) |
| `/api/auth/notifications/` | GET | accounts | List notifications |
| `/api/patient/profile/` | GET/POST | patients | Health profile |
| `/api/patient/vitals/` | GET/POST | patients | Vitals CRUD |
| `/api/patient/vitals/latest/` | GET | patients | Latest vitals |
| `/api/patient/lifestyle/` | GET/POST | patients | Lifestyle logs |
| `/api/ml/risk-scores/` | GET | ml_engine | Latest risk scores |
| `/api/ml/risk-scores/calculate/` | POST | ml_engine | Trigger ML prediction |
| `/api/ml/risk-scores/history/` | GET | ml_engine | Risk score trends |
| `/api/ml/what-if/` | POST | ml_engine | What-If simulation |
| `/api/ml/model-metrics/` | GET | ml_engine | Model performance (admin) |
| `/api/chatbot/session/` | POST | chatbot | Start/resume session |
| `/api/chatbot/message/` | POST | chatbot | Send message, get reply |
| `/api/chatbot/history/` | GET | chatbot | Conversation history |
| `/api/chatbot/symptoms/` | GET | chatbot | Symptom memory |
| `/api/reports/generate/` | POST | reports | Generate PDF report |
| `/api/reports/download/<id>/` | GET | reports | Download report |

---

## 5. Machine Learning Pipeline — Explained

### 5.1 Overview

The ML pipeline predicts the probability of three medical conditions:

1. **Diabetes (Type 2)**
2. **Heart Disease (Cardiovascular Disease / CVD)**
3. **Hypertension (High Blood Pressure)**

### 5.2 Input Features (16 features)

The ML models take a **16-dimensional feature vector** extracted from the patient's health profile and latest vitals:

| # | Feature | Source | Type |
|---|---------|--------|------|
| 1 | `age` | Demographics | Integer |
| 2 | `bmi` | Demographics (calculated) | Float |
| 3 | `height_cm` | Demographics | Float |
| 4 | `weight_kg` | Demographics | Float |
| 5 | `heart_rate` | Vitals | Integer |
| 6 | `systolic_bp` | Vitals | Integer |
| 7 | `diastolic_bp` | Vitals | Integer |
| 8 | `spo2` | Vitals | Float |
| 9 | `blood_glucose` | Vitals | Float |
| 10 | `temperature` | Vitals | Float |
| 11 | `smoking` | Lifestyle | Binary (0/1) |
| 12 | `alcohol` | Lifestyle | Binary (0/1) |
| 13 | `exercise_sedentary` | Lifestyle | Binary (0/1) |
| 14 | `family_diabetes` | Family History | Binary (0/1) |
| 15 | `family_heart` | Family History | Binary (0/1) |
| 16 | `family_hypertension` | Family History | Binary (0/1) |

### 5.3 Model: XGBoost Classifier

Each condition is trained with an independent **XGBClassifier** (XGBoost — eXtreme Gradient Boosting):

```python
clf = XGBClassifier(
    n_estimators=200,       # 200 boosting rounds (trees)
    max_depth=4,            # Each tree has max depth 4
    learning_rate=0.05,     # Conservative learning rate
    subsample=0.8,          # 80% row sampling per tree
    colsample_bytree=0.8,  # 80% column sampling per tree
    eval_metric='logloss',  # Log-loss for binary classification
    random_state=42,        # Reproducible results
)
```

**Why XGBoost?**
- State-of-the-art performance on tabular/structured data
- Handles missing values natively
- Built-in regularization prevents overfitting
- Fast training and inference
- Provides `predict_proba()` for probability outputs (not just yes/no)

### 5.4 Training Process

The training script (`train_models.py`) follows this workflow:

```
1. Generate synthetic data (1000 samples)
        ↓
2. Create binary labels using weighted feature combinations + noise
        ↓
3. Split into train (80%) / test (20%) with stratified sampling
        ↓
4. Train XGBClassifier for each condition
        ↓
5. Evaluate: Accuracy, ROC-AUC, F1-Score
        ↓
6. Save trained models as .pkl files to ml_engine/trained_models/
```

**Synthetic label generation example (Diabetes):**
```python
diabetes_label = (
    (BMI > 28) × 0.30           # Obesity contributes 30%
    + (Glucose > 130) × 0.30    # High glucose contributes 30%
    + (Age > 45) × 0.15         # Age contributes 15%
    + Family_Diabetes × 0.15    # Genetics contributes 15%
    + Sedentary × 0.10          # Inactivity contributes 10%
    + Random_Noise              # Adds uncertainty
)
# Threshold at 0.45 → binary 0/1
```

### 5.5 Prediction Pipeline (Runtime)

When a patient requests risk scores, the system follows this flow:

```
Patient Profile + Latest Vitals
        ↓
Extract 16-feature vector (_extract_features)
        ↓
    ┌─── ML models loaded? ───┐
    │ YES                     │ NO
    ↓                         ↓
_ml_predict()            _rule_based_scoring()
(XGBoost predict_proba)  (Weighted heuristic formulas)
    │                         │
    └─────────┬───────────────┘
              ↓
    _apply_cascade_effects()
    (e.g., high diabetes → elevates heart disease)
              ↓
    Return: { conditions, cascade_effects }
```

### 5.6 Dual-Mode Scoring (ML + Fallback)

The system has a **dual-mode** design:

1. **ML Mode (Primary):** Uses trained XGBoost models loaded from `.pkl` files. Outputs calibrated probabilities.
2. **Rule-Based Mode (Fallback):** If models aren't trained yet, uses hand-crafted medical heuristics with weighted scoring. This ensures the system works out-of-the-box before ML training.

### 5.7 Cascade Effects

MediTwin models **co-occurring risk chains** — how one condition's risk elevates another:

| Source Condition | Target Condition | Boost Factor |
|-----------------|-----------------|--------------|
| Diabetes | Heart Disease | +18% |
| Diabetes | Hypertension | +12% |
| Hypertension | Heart Disease | +15% |
| Heart Disease | Hypertension | +10% |

Cascades only activate when the source condition's probability exceeds 50%.

### 5.8 SHAP-Style Explainability

For each condition, the system generates human-readable explanations of **which factors are driving the risk**:

```json
{
  "diabetes": {
    "overall_risk": 0.62,
    "risk_level": "high",
    "top_factors": [
      { "feature": "BMI", "value": 32.5, "impact_pct": 7.5, "direction": "increasing",
        "description": "Your BMI of 32.5 is contributing +7.5% to your Diabetes risk" },
      { "feature": "Blood Glucose", "value": 145, "impact_pct": 6.8, "direction": "increasing",
        "description": "Blood glucose of 145 mg/dL is contributing +6.8% to Diabetes risk" }
    ]
  }
}
```

### 5.9 ML Advantages

- **Ensemble prediction** with XGBoost provides strong accuracy on tabular data
- **Fallback rule-based system** ensures the app works even without trained models
- **Cascade modeling** captures real-world disease co-occurrence patterns
- **Explainable AI** — patients can understand *why* their risk is high
- **What-If simulation** connects predictions to actionable lifestyle changes

### 5.10 ML Disadvantages

- **Synthetic training data** — models are trained on algorithmically generated data, not real clinical datasets
- **No SHAP library integration** — explanations are rule-based approximations, not true SHAP values from the `shap` library
- **No model retraining** — models are trained once and not updated with new patient data
- **Only 3 conditions** — doesn't cover many important diseases (cancer, kidney disease, stroke, etc.)
- **No cross-validation** — single 80/20 train-test split used (more robust k-fold CV recommended)

---

## 6. Frontend (React) — Explained

### 6.1 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19 | UI library with hooks and functional components |
| **Vite** | 8 | Fast build tool and development server with HMR |
| **TanStack Router** | 1.x | File-based routing (each `.jsx` file in `routes/` becomes a page) |
| **TanStack Query** | 5.x | Server state management, caching, and automatic refetching |
| **TailwindCSS** | 4 | Utility-first CSS framework for rapid styling |
| **Shadcn/UI + Radix** | Latest | Accessible, unstyled component primitives (modals, dropdowns, tabs, etc.) |
| **Recharts** | 2.x | Data visualization library for health vitals charts |
| **Framer Motion** | Latest | Fluid page transitions and micro-animations |
| **Socket.IO Client** | 4.7 | WebSocket client for real-time vitals streaming |
| **Lucide React** | Latest | Modern icon library |
| **Sonner** | 2.x | Toast notification library |
| **Zod** | 3.x | Runtime schema validation for form data |
| **React Hook Form** | 7.x | Performant form state management |

### 6.2 Project Structure

```
Frontend/src/
├── assets/           ← Static images, logos
├── components/       ← Reusable UI components (AppShell, Logo, Shadcn/UI)
├── context/          ← React Context providers:
│   ├── AuthContext    ← JWT token management, user state
│   ├── SocketContext  ← Socket.IO connection management
│   └── DemoContext    ← Demo mode (simulated data when backend is offline)
├── hooks/            ← Custom hooks (animations, motion effects)
├── lib/              ← API client (axios/fetch wrappers), utilities
│   └── api.js        ← Centralized API functions (patientAPI, mlAPI, etc.)
├── routes/           ← File-based pages (each file = one route):
│   ├── __root.jsx     ← Root layout with navigation
│   ├── index.jsx      ← Landing page (/)
│   ├── login.jsx      ← Login page (/login)
│   ├── register.jsx   ← Registration (/register)
│   ├── onboarding.jsx ← Patient onboarding (/onboarding)
│   ├── dashboard.jsx  ← Main dashboard (/dashboard)
│   ├── twin.jsx       ← Digital twin view (/twin)
│   ├── whatif.jsx     ← What-If simulator (/whatif)
│   ├── chatbot.jsx    ← AI chatbot (/chatbot)
│   ├── doctor.jsx     ← Doctor portal (/doctor)
│   ├── lifestyle.jsx  ← Lifestyle recommendations (/lifestyle)
│   ├── reports.jsx    ← PDF reports (/reports)
│   ├── profile.jsx    ← User profile (/profile)
│   ├── about.jsx      ← About page (/about)
│   ├── contact.jsx    ← Contact page (/contact)
│   └── services.jsx   ← Services page (/services)
├── styles.css         ← Global TailwindCSS stylesheet (22 KB)
├── router.jsx         ← Router configuration
└── routeTree.gen.js   ← Auto-generated route tree
```

### 6.3 Key Frontend Patterns

**Authentication Flow:**
1. User logs in → JWT `access_token` and `refresh_token` stored in `localStorage`
2. All API calls include `Authorization: Bearer <token>` header
3. Routes check for `access_token` in `beforeLoad` — redirect to `/login` if missing
4. Token refresh is handled automatically when the access token expires

**Demo Mode:**
- The `DemoContext` provides a demo mode that generates simulated data on the client side
- This allows the frontend to be showcased even when the Django backend is not running
- Demo data generators produce realistic vitals, risk scores, and profiles

**Real-Time Integration:**
- `SocketContext` manages the Socket.IO connection lifecycle
- After login, the client emits an `authenticate` event with the `userId`
- The `vitals:update` and `vitals:anomaly` events update the dashboard in real-time

### 6.4 Frontend Advantages

- **Modern stack** — React 19 + Vite 8 for fast development and hot reloading
- **File-based routing** — Adding a new page is as simple as creating a new `.jsx` file
- **Responsive design** — TailwindCSS ensures the app looks good on all screen sizes
- **Accessible components** — Radix/Shadcn primitives are WAI-ARIA compliant
- **Demo mode** — Works standalone without the backend
- **Rich data visualization** — Recharts renders health data in intuitive charts

### 6.5 Frontend Disadvantages

- **No SSR (Server-Side Rendering)** — All rendering happens in the browser, which affects SEO and initial load time
- **localStorage for tokens** — Vulnerable to XSS attacks. HttpOnly cookies would be more secure
- **Large bundle size** — Many Radix UI components are imported even if not all are used
- **No PWA support** — Cannot install as a mobile app or work offline
- **No internationalization (i18n)** — English only

---

## 7. Real-Time Server (Node.js) — Explained

### 7.1 Purpose

The Node.js server is a dedicated **real-time data streaming** service. It exists separately from the Django backend because:

1. **Django is synchronous** — not ideal for persistent WebSocket connections
2. **Node.js excels at I/O-bound tasks** — handling thousands of concurrent WebSocket connections efficiently
3. **Separation of concerns** — REST APIs (Django) and real-time streaming (Node.js) have different scaling needs

### 7.2 Technology

| Library | Purpose |
|---------|---------|
| `Express 5` | HTTP framework (health check endpoint) |
| `Socket.IO` | Bi-directional WebSocket engine with fallback to polling |
| `cors` | Cross-origin support |

### 7.3 How It Works

```
Client connects via WebSocket
        ↓
Client emits 'authenticate' event { userId, token }
        ↓
Server validates and joins user to a private room (user_<id>)
        ↓
Server starts setInterval (every 2 seconds):
    → Generate simulated vitals (7 parameters)
    → Run anomaly detection (threshold-based)
    → Emit 'vitals:update' to user's room
    → If anomalies detected → Emit 'vitals:anomaly'
        ↓
Client disconnects → Clear interval, remove from maps
```

### 7.4 Key Features

- **Room-based broadcasting** — Each user gets a private Socket.IO room, so data is never leaked to other users
- **Threshold-based anomaly detection** — Simple but effective real-time health monitoring
- **Forced anomaly trigger** — A `trigger:anomaly` event lets the frontend demo abnormal readings
- **Health check endpoint** — `GET /health` returns server status

### 7.5 Advantages

- Lightweight and fast — handles many concurrent connections
- Socket.IO provides automatic reconnection and fallback to HTTP polling
- Clean separation from the Django backend

### 7.6 Disadvantages

- In-memory Maps (`connectedUsers`, `userSockets`) are not persistent — lost on server restart
- No Redis for multi-server scaling
- JWT verification is not actually implemented (commented as "In production, verify the token here")
- Only simulated data — no real device integration

---

## 8. Database (MongoDB) — Explained

### 8.1 Why MongoDB?

MediTwin uses **MongoDB** (NoSQL document database) because:

1. **Flexible schema** — Health data varies per patient (different conditions, medications, allergies). MongoDB's document model handles this naturally without rigid table schemas.
2. **Time-series data** — Vital signs are append-heavy, time-ordered data that MongoDB handles efficiently.
3. **JSON-native** — REST APIs naturally work with JSON; MongoDB stores BSON (binary JSON) documents directly.
4. **Rapid iteration** — Schema changes don't require migrations like SQL databases.

### 8.2 Collections Used

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User accounts (via Django ORM/MongoDB backend) | username, role, email, onboarding_complete |
| `health_profiles` | Patient demographics, lifestyle, medical history | user_id, demographics, lifestyle, family_history, medications |
| `vitals` | Vital sign readings (time-series) | user_id, heart_rate, systolic_bp, spo2, recorded_at |
| `risk_scores` | ML prediction results | user_id, scores, shap_explanations, calculated_at |
| `lifestyle_logs` | Diet, exercise, sleep logs | user_id, type, details, logged_at |
| `doctor_profiles` | Doctor-specific information | user_id, specialization, license_number |
| `notifications` | In-app alerts | user_id, message, severity, read, created_at |
| `audit_logs` | Security audit trail | user_id, action, ip_address, timestamp |
| `medical_qa` | 1.7M medical Q&A pairs for chatbot | question, answer |
| `chatbot_sessions` | Chatbot conversation sessions | user_id, messages[], symptoms[], created_at |
| `reports` | Generated PDF report metadata | user_id, filename, generated_at |

### 8.3 Advantages

- Schema-less design accommodates evolving health data models
- Fast writes for high-frequency vitals data
- Text indexes on `medical_qa` for fast chatbot search
- Native aggregation pipeline for symptom memory and analytics

### 8.4 Disadvantages

- No ACID transactions across collections (eventual consistency)
- No built-in relational joins (requires application-level joins)
- Large medical_qa collection (1.7M docs) needs proper indexing for performance
- No built-in data encryption at rest (requires MongoDB Enterprise)

---

## 9. Advantages

### Technical Advantages

| # | Advantage | Explanation |
|---|-----------|-------------|
| 1 | **Microservices architecture** | Three independent services (Django, Node.js, React) can be deployed, scaled, and maintained separately |
| 2 | **Real-time monitoring** | WebSocket-based vitals streaming provides instant updates without page refresh |
| 3 | **ML-powered predictions** | XGBoost ensemble models provide data-driven risk assessment, superior to simple threshold checks |
| 4 | **Explainable AI** | SHAP-style explanations help patients understand *why* their risk is high, not just *that* it is |
| 5 | **What-If simulation** | Empowers patients by showing the concrete impact of lifestyle changes |
| 6 | **Evidence-based CDS** | Clinical alerts grounded in AHA/ADA guidelines bridge the gap between data and medical action |
| 7 | **Dual-mode scoring** | System works even without trained ML models (falls back to rule-based scoring) |
| 8 | **Modern tech stack** | React 19, Django 6, XGBoost, Socket.IO — industry-relevant technologies |
| 9 | **Role-based access** | Patient, Doctor, and Admin roles ensure appropriate data access |
| 10 | **Demo mode** | Frontend works standalone with simulated data — great for presentations |

### Healthcare Advantages

| # | Advantage | Explanation |
|---|-----------|-------------|
| 1 | **Proactive healthcare** | Detects risk *before* symptoms appear |
| 2 | **Patient empowerment** | Patients understand their own health data |
| 3 | **Doctor efficiency** | Doctors can monitor multiple patients from one dashboard |
| 4 | **Downloadable reports** | PDF reports bridge digital monitoring and in-person doctor visits |
| 5 | **24/7 AI chatbot** | Provides medical information triage any time of day |

---

## 10. Disadvantages

### Technical Disadvantages

| # | Disadvantage | Explanation | Potential Fix |
|---|-------------|-------------|---------------|
| 1 | **Synthetic training data** | ML models are trained on algorithmically generated data, not real clinical datasets | Use curated medical datasets (MIMIC-III, UK Biobank) |
| 2 | **No real device integration** | Vitals are simulated, not from actual wearables/sensors | Integrate with Apple Health, Fitbit, or HL7 FHIR APIs |
| 3 | **No model retraining** | Models are trained once and never updated with new patient data | Implement online learning or periodic retraining pipelines |
| 4 | **Token in localStorage** | JWT stored in localStorage is vulnerable to XSS attacks | Use HttpOnly cookies with CSRF protection |
| 5 | **No HTTPS enforcement** | Development setup runs on HTTP | Deploy with SSL/TLS certificates |
| 6 | **In-memory session store** | Node.js server loses all connections on restart | Use Redis for session/connection management |
| 7 | **No automated testing CI/CD** | No continuous integration pipeline for automated testing | Add GitHub Actions with test suites |
| 8 | **Limited error handling** | Some edge cases in API views may not be handled gracefully | Add comprehensive try/catch blocks and error middleware |
| 9 | **No data backup** | No automated MongoDB backup strategy | Implement mongodump cron jobs or MongoDB Atlas backups |
| 10 | **No rate limiting on WebSocket** | Socket.IO server doesn't throttle message frequency | Add rate limiting per socket connection |

### Healthcare / Compliance Disadvantages

| # | Disadvantage | Explanation |
|---|-------------|-------------|
| 1 | **Not HIPAA compliant** | No data encryption at rest, no audit-grade access controls |
| 2 | **No FDA approval** | ML predictions are not validated for clinical use |
| 3 | **AI hallucination risk** | The Ollama chatbot may generate medically inaccurate information |
| 4 | **No multi-language support** | Interface is English-only, limiting accessibility |
| 5 | **Static clinical rules** | CDS thresholds don't adapt to individual patient baselines |

---

## 11. Future Scope

| Enhancement | Description |
|-------------|-------------|
| **Real wearable integration** | Connect to Apple Health, Google Fit, Fitbit, or medical-grade sensors via BLE/APIs |
| **Real clinical datasets** | Train models on MIMIC-III, eICU, or UK Biobank for clinically validated predictions |
| **SHAP library integration** | Use the actual `shap` Python library for true model explanations |
| **More disease predictions** | Add Stroke, Chronic Kidney Disease, COPD, Cancer risk models |
| **Mobile app (React Native)** | Build a mobile companion app for on-the-go health monitoring |
| **HL7 FHIR compliance** | Support healthcare data interoperability standards |
| **Telemedicine integration** | Add video calling between patients and doctors |
| **Multi-language support** | Internationalize the interface for global accessibility |
| **Push notifications** | Email, SMS, and push alerts for critical health events |
| **HIPAA compliance** | End-to-end encryption, audit logging, and access controls |

---

> **Disclaimer:** MediTwin is an academic project built for demonstration and learning purposes. The ML predictions and clinical alerts are **not** validated for real clinical use. Always consult a qualified healthcare professional for medical decisions.

---

*Created by Harshil, Diya, and Mahi — Semester 4 Project*
