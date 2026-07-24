# 💻 Project Requirements & Dependencies

This document outlines the system requirements, software prerequisites, and major dependencies required to run the MediTwin project.

## 🛠️ System Requirements
- **OS:** Windows 10/11, macOS, or Linux
- **RAM:** Minimum 8GB (16GB recommended for running ML models locally)
- **Disk Space:** ~2GB (Mainly for MongoDB, HuggingFace NLP datasets, and Node modules)

## 📦 Core Software Prerequisites
You must have the following installed on your machine to run the project locally:
1. **[Python 3.10 or 3.11](https://www.python.org/downloads/)** (Django Backend & ML Engine)
2. **[Node.js 18+ (LTS)](https://nodejs.org/)** (React Frontend & Real-time Server)
3. **[MongoDB Community Server](https://www.mongodb.com/try/download/community)** (Must be running on port `27017`)
4. **[Git](https://git-scm.com/)** (Version control)

---

## 🐍 Backend Dependencies (Python)
The backend is powered by **Django** and uses **PyMongo** instead of the standard ORM. It also heavily utilizes data science and machine learning libraries.

**Core Packages:**
- `Django` & `djangorestframework` (API framework)
- `pymongo` (MongoDB driver)
- `PyJWT` & `django-cors-headers` (Auth and security)
- `reportlab` (PDF generation for health reports)

**ML Engine & Data Science Packages:**
- `pandas` & `numpy` (Data manipulation)
- `scikit-learn` (Model evaluation, metrics, and Random Forest)
- `xgboost` (High-performance gradient boosting for risk prediction)
- `shap` (Machine learning explainability for patient risk factors)

**Chatbot Packages:**
- `datasets` (HuggingFace library to load the 1.7M medical Q&A dataset)
- `scikit-learn` (Used for TF-IDF vectorization in the chatbot)

*(Full list in `meditwin/requirements.txt`)*

---

## ⚛️ Frontend Dependencies (Node.js)
The frontend is built for extreme speed and modern UI aesthetics.

**Core Packages:**
- `react` & `react-dom` (UI Library)
- `vite` (Lightning-fast build tool)
- `@tanstack/react-router` (File-based routing system)

**UI & Styling:**
- `tailwindcss` (Utility-first CSS)
- `lucide-react` (Iconography)
- `shadcn-ui` (Accessible, pre-built component system)
- `framer-motion` (Fluid animations and marquee dragging effects)
- `recharts` (Data visualization for health vitals)

**Real-time & Network:**
- `socket.io-client` (WebSockets for real-time vital streams)

*(Full list in `Frontend/package.json`)*

---

## ⚡ Real-Time Server Dependencies (Node.js)
The micro-server handles live streaming of vitals between devices and the dashboard.

**Core Packages:**
- `express` (Web framework)
- `socket.io` (WebSocket engine)
- `jsonwebtoken` (Auth verification matching Django's JWTs)
- `dotenv` (Environment variable management)

*(Full list in `realtime_server/package.json`)*

---

## 🔑 Environment Variables (.env)
You will need to configure environment variables depending on the environment.

**Django Backend (`meditwin/.env` or settings.py):**
- `SECRET_KEY`: Django secret key
- `MONGO_URI`: `mongodb://localhost:27017/meditwin_db`

**Real-Time Server (`realtime_server/.env`):**
- `PORT`: `4000` (or `3001` depending on config)
- `JWT_SECRET`: Must exactly match Django's `SECRET_KEY`
- `MONGO_URI`: `mongodb://localhost:27017`

**Frontend (`Frontend/.env`):**
- `VITE_API_URL`: `http://localhost:8000/api`
- `VITE_SOCKET_URL`: `http://localhost:4000`
