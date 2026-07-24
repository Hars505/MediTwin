"""
ML model training script for MediTwin.

Trains XGBoost, RandomForest, and GradientBoosting classifiers for:
  - Diabetes risk
  - Heart disease risk
  - Hypertension risk

Uses synthetic demo data so it runs out of the box.
Run from the Django project root:
    python manage.py shell -c "from ml_engine.training.train_models import main; main()"
"""
import os
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

MODELS_DIR = Path(__file__).resolve().parent.parent / 'trained_models'


def generate_synthetic_data(n=500):
    """Create a synthetic patient dataset for demo training."""
    rng = np.random.default_rng(42)
    data = {
        'age': rng.integers(18, 80, n),
        'bmi': rng.normal(26, 5, n).clip(15, 50).round(1),
        'height_cm': rng.normal(170, 10, n).clip(140, 200).round(0),
        'weight_kg': rng.normal(75, 15, n).clip(40, 150).round(1),
        'heart_rate': rng.integers(55, 110, n),
        'systolic_bp': rng.integers(90, 180, n),
        'diastolic_bp': rng.integers(55, 110, n),
        'spo2': rng.normal(97, 2, n).clip(85, 100).round(1),
        'blood_glucose': rng.normal(110, 30, n).clip(60, 300).round(0),
        'temperature': rng.normal(36.6, 0.4, n).clip(35.5, 39).round(1),
        'smoking': rng.choice([0, 1], n, p=[0.75, 0.25]),
        'alcohol': rng.choice([0, 1], n, p=[0.65, 0.35]),
        'exercise_sedentary': rng.choice([0, 1], n, p=[0.6, 0.4]),
        'family_diabetes': rng.choice([0, 1], n, p=[0.8, 0.2]),
        'family_heart': rng.choice([0, 1], n, p=[0.85, 0.15]),
        'family_hypertension': rng.choice([0, 1], n, p=[0.8, 0.2]),
    }
    df = pd.DataFrame(data)

    # Generate realistic binary labels based on feature combinations
    df['diabetes'] = (
        (df['bmi'] > 28).astype(int) * 0.3
        + (df['blood_glucose'] > 130).astype(int) * 0.3
        + (df['age'] > 45).astype(int) * 0.15
        + df['family_diabetes'] * 0.15
        + df['exercise_sedentary'] * 0.1
        + rng.normal(0, 0.15, n)
    )
    df['diabetes'] = (df['diabetes'] > 0.45).astype(int)

    df['heart_disease'] = (
        (df['systolic_bp'] > 140).astype(int) * 0.25
        + (df['heart_rate'] > 90).astype(int) * 0.15
        + (df['bmi'] > 30).astype(int) * 0.15
        + df['smoking'] * 0.2
        + (df['age'] > 50).astype(int) * 0.15
        + df['family_heart'] * 0.1
        + rng.normal(0, 0.15, n)
    )
    df['heart_disease'] = (df['heart_disease'] > 0.4).astype(int)

    df['hypertension'] = (
        (df['systolic_bp'] > 130).astype(int) * 0.3
        + (df['diastolic_bp'] > 85).astype(int) * 0.2
        + (df['bmi'] > 28).astype(int) * 0.15
        + df['smoking'] * 0.1
        + df['alcohol'] * 0.1
        + df['family_hypertension'] * 0.15
        + rng.normal(0, 0.15, n)
    )
    df['hypertension'] = (df['hypertension'] > 0.4).astype(int)

    return df


FEATURE_COLS = [
    'age', 'bmi', 'height_cm', 'weight_kg',
    'heart_rate', 'systolic_bp', 'diastolic_bp',
    'spo2', 'blood_glucose', 'temperature',
    'smoking', 'alcohol', 'exercise_sedentary',
    'family_diabetes', 'family_heart', 'family_hypertension',
]

CONDITIONS = ['diabetes', 'heart_disease', 'hypertension']


def train_condition(condition, X, y):
    """Train three classifiers for one condition and save the best."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y,
    )

    classifiers = {
        'xgb': XGBClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8,
            eval_metric='logloss', use_label_encoder=False,
            random_state=42,
        ),
        'rf': RandomForestClassifier(
            n_estimators=150, max_depth=6, min_samples_leaf=3, random_state=42,
        ),
        'gb': GradientBoostingClassifier(
            n_estimators=150, learning_rate=0.07, max_depth=3, random_state=42,
        ),
    }

    best_model = None
    best_auc = -1
    results = {}

    for name, clf in classifiers.items():
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        probas = clf.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, probas)
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds)

        results[name] = {'accuracy': acc, 'auc_roc': auc, 'f1_score': f1}
        print(f"  [{condition}:{name}] acc={acc:.3f}  auc={auc:.3f}  f1={f1:.3f}")

        if auc > best_auc:
            best_auc = auc
            best_model = clf

    # Save only the best model under the condition name
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELS_DIR / f'{condition}.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(best_model, f)
    print(f"  -> Best model saved to {model_path}")

    return results


def main():
    print("Generating synthetic training data...")
    df = generate_synthetic_data(n=1000)

    X = df[FEATURE_COLS]

    for cond in CONDITIONS:
        y = df[cond]
        print(f"\nTraining models for: {cond} (positive rate: {y.mean():.2%})")
        train_condition(cond, X, y)

    print("\n✅ Training complete. Models saved in:", MODELS_DIR)


if __name__ == '__main__':
    main()
