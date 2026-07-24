# ADR 0003: Machine Learning Risk Prediction and SHAP Explainability

* **Status**: Accepted
* **Date**: 2026-07-24

## Context

Patients and doctors need accurate predictive risk scores for chronic health conditions (Cardiovascular disease, Diabetes, Hypertension, Kidney disease), but black-box AI models reduce clinical trust and user compliance.

## Decision

We implement a **Dual-Tier ML Prediction Engine**:
1. **Model Pipeline**: Ensembles of XGBoost, Random Forest, Logistic Regression, and Neural Networks trained on standardized health feature vectors.
2. **SHAP (SHapley Additive exPlanations)**: Calculates exact feature contribution scores for every prediction, explaining to patients *why* their risk score changed (e.g. "+12% risk due to elevated Systolic Blood Pressure").
3. **What-If Simulation**: Enables patients to simulate lifestyle adjustments (e.g. lowering BMI by 2 points) and preview risk reductions in real time.

## Consequences

### Positive
* High clinical interpretability builds patient trust.
* Actionable insights encourage lifestyle improvements.
* Deterministic fallback heuristic ensures calculation reliability even if model binaries are updating.

### Negative
* SHAP calculations require additional compute cycles, necessitating rate limiting on prediction endpoints.
