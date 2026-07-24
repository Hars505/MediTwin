<p align="center">
  <img src="https://img.shields.io/badge/MediTwin-Digital%20Health%20Twin-00C9A7?style=for-the-badge&logo=dna&logoColor=white" alt="MediTwin" />
</p>

<h1 align="center">MediTwin</h1>

<p align="center">
  <strong>Your AI-Powered Digital Twin for Predictive Healthcare</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/MongoDB-NoSQL-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/XGBoost-ML-FF6600?style=flat-square&logo=xgboost&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Academic-yellow?style=flat-square" />
</p>

<p align="center">
  <em>MediTwin creates a living digital replica of a patient's health — combining real-time vital sign monitoring with machine learning predictive models to act as an early-warning system and health companion for patients and clinicians alike.</em>
</p>

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Running Tests](#running-tests)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License & Disclaimer](#license--disclaimer)

---

## Key Features

| Feature | Description |
|---|---|
| **Digital Twin Dashboard** | Real-time visualization of health vitals (Heart Rate, BP, SpO2, Temperature) streamed via WebSockets with live charting. |
| **ML Risk Predictions** | Ensemble models (XGBoost, Random Forest, Gradient Boosting) predict risk for **Cardiovascular Disease**, **Diabetes**, and **Hypertension**. |
| **What-If Simulator** | Interactive sliders let users see how lifestyle changes (weight loss, BP control, diet) instantly shift their predicted disease risk. |
| **Medical AI Chatbot** | TF-IDF NLP chatbot trained on **1.7 million** medical Q&A pairs for triage and health inquiries. |
| **PDF Health Reports** | One-click generation of comprehensive clinical reports ready for doctor visits. |
| **Clinical Alert System** | Built-in Clinical Decision Support (CDS) engine flags anomalies against **ADA** and **AHA** medical guidelines. |
| **Doctor Portal** | Dedicated clinician interface for monitoring assigned patients and reviewing risk profiles. |
| **Patient Onboarding** | Guided health profile setup collecting medical history, lifestyle data, and baseline vitals. |

---

## Architecture

MediTwin follows a **microservices-inspired architecture** with three independent services communicating through REST APIs and WebSockets:

```
+----------------------------------------------------------------------+
|                         CLIENT (Browser)                             |
|            React 19 + TailwindCSS + Shadcn/UI + Recharts             |
+--------------+-----------------------------------+-------------------+
               |  REST API (HTTP)                  |  WebSocket
               v                                   v
+--------------------------+        +------------------------------+
|   Django REST Backend    |        |  Node.js Real-Time Server    |
|   ---------------------  |        |  ------------------------    |
|   - Auth (JWT)           |        |  - Socket.IO Engine          |
|   - Patient Management   |<------>|  - Live Vitals Streaming     |
|   - ML Engine            | Shared |  - JWT Verification          |
|   - Clinical Rules (CDS) | Mongo  |                              |
|   - Chatbot (NLP)        |   DB   |                              |
|   - PDF Report Gen       |        |                              |
+----------+---------------+        +--------------+---------------+
           |                                       |
           v                                       v
+----------------------------------------------------------------------+
|                        MongoDB (NoSQL)                               |
|         patients - vitals - health_profiles - reports - qa_pairs     |
+----------------------------------------------------------------------+
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11** | Core language |
| **Django 6.0** | Web framework |
| **Django REST Framework** | RESTful API layer |
| **PyMongo** | MongoDB driver (bypasses Django ORM) |
| **SimpleJWT** | Token-based authentication |
| **XGBoost** | Gradient boosting for disease prediction |
| **scikit-learn** | Random Forest, metrics, TF-IDF vectorization |
| **ReportLab** | PDF health report generation |
| **HuggingFace Datasets** | Loading 1.7M medical Q&A dataset |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite 8** | Build tool & dev server |
| **TanStack Router** | File-based routing |
| **TanStack Query** | Server state management |
| **TailwindCSS 4** | Utility-first styling |
| **Shadcn/UI + Radix** | Accessible component primitives |
| **Recharts** | Health vitals data visualization |
| **Framer Motion** | Fluid animations |
| **Socket.IO Client** | Real-time WebSocket connection |

### Real-Time Server
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express 5** | HTTP framework |
| **Socket.IO** | Bi-directional WebSocket engine |

### Database
| Technology | Purpose |
|---|---|
| **MongoDB** | Document-oriented NoSQL database |

---

## Project Structure

```
MediTwin/
|
|-- Frontend/                    # React 19 + Vite + TailwindCSS
|   |-- src/
|   |   |-- components/          # Reusable UI components (Layout, Logo, Shadcn/UI)
|   |   |-- context/             # React context providers
|   |   |-- hooks/               # Custom React hooks
|   |   |-- lib/                 # API client & utilities
|   |   |-- routes/              # File-based pages (TanStack Router)
|   |   |   |-- index.jsx        #   Landing page
|   |   |   |-- dashboard.jsx    #   Digital Twin dashboard
|   |   |   |-- twin.jsx         #   Real-time vitals view
|   |   |   |-- whatif.jsx       #   What-If simulator
|   |   |   |-- chatbot.jsx      #   AI medical chatbot
|   |   |   |-- doctor.jsx       #   Doctor portal
|   |   |   |-- lifestyle.jsx    #   Lifestyle recommendations
|   |   |   |-- reports.jsx      #   PDF report generation
|   |   |   |-- onboarding.jsx   #   Patient profile setup
|   |   |   |-- login.jsx        #   Authentication
|   |   |   +-- register.jsx     #   User registration
|   |   +-- styles.css           # Global stylesheet
|   +-- package.json
|
|-- meditwin/                    # Django REST Framework Backend
|   +-- medi_Twin/
|       |-- accounts/            # User auth, registration, JWT management
|       |-- patients/            # Health profiles & vitals CRUD
|       |-- ml_engine/           # ML models, clinical rules, risk prediction
|       |   |-- predictor.py     #   Ensemble prediction pipeline
|       |   |-- clinical_rules.py#   ADA/AHA guideline engine
|       |   +-- training/        #   Model training scripts
|       |-- chatbot/             # NLP chatbot & medical Q&A engine
|       |   |-- qa_engine.py     #   TF-IDF similarity search
|       |   +-- load_dataset.py  #   HuggingFace dataset loader
|       |-- reports/             # PDF clinical report generation
|       |   +-- generator.py     #   ReportLab PDF builder
|       +-- medi_Twin/           # Django project settings & URL config
|
|-- realtime_server/             # Node.js + Socket.IO
|   +-- server.js                # WebSocket server for live vitals
|
|-- requirements.txt             # Python dependencies
|-- pyproject.toml               # Python tooling config (Black, Ruff, isort)
|-- REQUIREMENTS.md              # Detailed dependency documentation
|-- CODING_STANDARDS.md          # Team coding guidelines
+-- .pre-commit-config.yaml      # Pre-commit hooks
```

---

## Getting Started

### Prerequisites

| Software | Version | Download |
|---|---|---|
| Python | 3.10 or 3.11 | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ LTS | [nodejs.org](https://nodejs.org/) |
| MongoDB Community | Latest | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

### 1. Clone the Repository

```bash
git clone https://github.com/Hars505/MediTwin.git
cd MediTwin
```

### 2. Database Setup (MongoDB)

Make sure MongoDB is running locally on `mongodb://localhost:27017`, then initialize the database:

```bash
cd meditwin

# Initialize database collections
python manage.py shell -c "from medi_Twin.init_collections import setup; setup()"

# Train the ML models
python manage.py shell -c "from ml_engine.training.train_models import main; main()"

# Load the medical Q&A dataset for the chatbot
python manage.py shell -c "from chatbot.load_dataset import main; main()"
```

### 3. Start the Django Backend

```bash
cd meditwin
pip install -r ../requirements.txt
python manage.py runserver 8000
```

> The API will be available at `http://localhost:8000/api/`

### 4. Start the Real-Time WebSocket Server

```bash
cd realtime_server
npm install
npm start
```

> The WebSocket server will be available at `http://localhost:4000`

### 5. Start the React Frontend

```bash
cd Frontend
npm install
npm run dev
```

> Open your browser and navigate to **`http://localhost:5173`**

---

## Environment Variables

Create `.env` files in each service directory:

<details>
<summary><strong>Django Backend</strong> -- <code>meditwin/.env</code></summary>

```env
SECRET_KEY=your-django-secret-key
MONGO_URI=mongodb://localhost:27017/meditwin_db
DEBUG=True
```
</details>

<details>
<summary><strong>Real-Time Server</strong> -- <code>realtime_server/.env</code></summary>

```env
PORT=4000
JWT_SECRET=your-django-secret-key    # Must match Django's SECRET_KEY
MONGO_URI=mongodb://localhost:27017
```
</details>

<details>
<summary><strong>React Frontend</strong> -- <code>Frontend/.env</code></summary>

```env
VITE_API_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:4000
```
</details>

> **Important:** The `JWT_SECRET` in the real-time server **must exactly match** Django's `SECRET_KEY` for authentication to work across services.

---

## API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/accounts/register/` | `POST` | Register a new patient/doctor account |
| `/api/accounts/login/` | `POST` | Authenticate & receive JWT tokens |
| `/api/accounts/token/refresh/` | `POST` | Refresh an expired access token |
| `/api/patients/profile/` | `GET/PUT` | Retrieve or update health profile |
| `/api/patients/vitals/` | `GET/POST` | Read or submit vital sign data |
| `/api/ml/predict/` | `POST` | Get disease risk predictions |
| `/api/ml/whatif/` | `POST` | Run what-if lifestyle simulations |
| `/api/ml/clinical-alerts/` | `GET` | Retrieve active clinical alerts |
| `/api/chatbot/ask/` | `POST` | Ask the medical AI chatbot |
| `/api/chatbot/history/` | `GET` | Retrieve conversation history |
| `/api/reports/generate/` | `POST` | Generate a PDF health report |
| `/api/reports/download/<id>/` | `GET` | Download a generated report |

> All endpoints (except auth) require a valid JWT `Authorization: Bearer <token>` header.

---

## Running Tests

```bash
# Backend tests (Django)
cd meditwin
python manage.py test

# Frontend lint
cd Frontend
npm run lint
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-feature`)
3. **Commit** your changes using [conventional commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add amazing feature'`)
4. **Push** to your branch (`git push origin feat/amazing-feature`)
5. **Open** a Pull Request

> Please read [CODING_STANDARDS.md](CODING_STANDARDS.md) before contributing to ensure consistency.

---

## Documentation

Additional project documentation is available in the [`docs/`](docs/) folder:

| Document | Description |
|---|---|
| [REQUIREMENTS.md](REQUIREMENTS.md) | Full system requirements and dependency list |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | Team coding guidelines and conventions |
| [Hybrid Database Architecture](docs/adr/Hybrid-database-architecture.md) | Decision record for the Django + MongoDB setup |
| [JWT Authentication & RBAC](docs/adr/Jwt-authentication-and-rbac.md) | Decision record for auth and role-based access |
| [ML Risk Prediction & SHAP](docs/adr/ML-risk-prediction-and-shap.md) | Decision record for the ML engine design |
| [Security Headers & Rate Limiting](docs/adr/Security-headers-and-rate-limiting.md) | Decision record for security hardening |

---

## License & Disclaimer

This project was built for **academic and research purposes** (Semester 4 Project).

> [!WARNING]
> The ML predictions and clinical alerts provided by MediTwin are for **demonstration and decision-support only**. They do **not** replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.

---

<p align="center">
  Created by Harshil, Diya and Mahi
</p>
