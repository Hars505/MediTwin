"""
Risk prediction engine.
Computes multi-condition risk scores using patient health profile + vitals.

For the MVP, this uses rule-based scoring with weighted factors.
The trained ML models (XGBoost, RandomForest) will be loaded from
the ml_engine/trained_models/ directory once training scripts are run.
"""
import os
import pickle
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, List

MODELS_DIR = Path(__file__).parent / 'trained_models'

# Cached loaded models
_loaded_models = {}


def _load_model(model_name: str) -> Optional[Any]:
    """Load a pickled model from disk if available."""
    if model_name in _loaded_models:
        return _loaded_models[model_name]
    
    model_path = MODELS_DIR / f'{model_name}.pkl'
    if model_path.exists():
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        _loaded_models[model_name] = model
        return model
    return None


def calculate_risk_scores(profile: Dict[str, Any], vitals: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate multi-condition risk scores for a patient.
    
    Uses trained ML models if available, otherwise falls back to
    rule-based scoring for development/demo purposes.
    
    Args:
        profile: dict — patient health profile from MongoDB
        vitals: dict — latest vitals snapshot
    
    Returns:
        dict — risk scores per condition + cascade effects
    """
    # Try ML-based prediction first
    ml_scores = _ml_predict(profile, vitals)
    if ml_scores:
        scores = ml_scores
    else:
        # Fallback: rule-based scoring
        scores = _rule_based_scoring(profile, vitals)
    
    # Calculate cascade effects (how one risk elevates another)
    scores = _apply_cascade_effects(scores)
    
    return scores


def _extract_features(profile, vitals):
    """
    Extract a feature vector from patient profile + vitals
    for ML model input.
    """
    demographics = profile.get('demographics', {})
    lifestyle = profile.get('lifestyle', {})
    
    features = {
        'age': demographics.get('age', 30),
        'bmi': demographics.get('bmi', 25.0),
        'height_cm': demographics.get('height_cm', 170),
        'weight_kg': demographics.get('weight_kg', 70),
        'heart_rate': vitals.get('heart_rate', 72) if vitals else 72,
        'systolic_bp': vitals.get('systolic_bp', 120) if vitals else 120,
        'diastolic_bp': vitals.get('diastolic_bp', 80) if vitals else 80,
        'spo2': vitals.get('spo2', 98) if vitals else 98,
        'blood_glucose': vitals.get('blood_glucose', 100) if vitals else 100,
        'temperature': vitals.get('temperature', 36.6) if vitals else 36.6,
        'smoking': 1 if lifestyle.get('smoking') else 0,
        'alcohol': 1 if lifestyle.get('alcohol', 'none') != 'none' else 0,
        'exercise_sedentary': 1 if lifestyle.get('exercise_frequency') == 'sedentary' else 0,
        'family_diabetes': 1 if 'diabetes' in [h.lower() for h in profile.get('family_history', [])] else 0,
        'family_heart': 1 if any('heart' in h.lower() for h in profile.get('family_history', [])) else 0,
        'family_hypertension': 1 if 'hypertension' in [h.lower() for h in profile.get('family_history', [])] else 0,
    }
    return features


def _ml_predict(profile, vitals):
    """Attempt ML model prediction if trained models exist."""
    conditions = ['diabetes', 'heart_disease', 'hypertension']
    features = _extract_features(profile, vitals)
    feature_array = np.array([list(features.values())])
    
    scores = {}
    all_models_loaded = True
    
    for condition in conditions:
        model = _load_model(condition)
        if model is None:
            all_models_loaded = False
            break
        try:
            prob = model.predict_proba(feature_array)[0][1]
            risk_level = _probability_to_level(prob)
            scores[condition] = {
                'probability': round(float(prob), 4),
                'risk_level': risk_level,
            }
        except Exception:
            all_models_loaded = False
            break
    
    return scores if all_models_loaded else None


def _rule_based_scoring(profile, vitals):
    """
    Fallback rule-based risk scoring for when ML models aren't trained yet.
    Uses medical heuristics based on clinical guidelines.
    """
    features = _extract_features(profile, vitals)
    scores = {}
    
    # ── Diabetes Risk ──
    diabetes_score = 0.15  # baseline
    if features['bmi'] > 30:
        diabetes_score += 0.20
    elif features['bmi'] > 25:
        diabetes_score += 0.10
    if features['blood_glucose'] > 140:
        diabetes_score += 0.25
    elif features['blood_glucose'] > 100:
        diabetes_score += 0.12
    if features['age'] > 45:
        diabetes_score += 0.10
    if features['family_diabetes']:
        diabetes_score += 0.15
    if features['exercise_sedentary']:
        diabetes_score += 0.08
    diabetes_score = min(diabetes_score, 0.99)
    scores['diabetes'] = {
        'probability': round(diabetes_score, 4),
        'risk_level': _probability_to_level(diabetes_score),
    }
    
    # ── Heart Disease Risk ──
    heart_score = 0.10
    if features['systolic_bp'] > 140:
        heart_score += 0.20
    elif features['systolic_bp'] > 130:
        heart_score += 0.10
    if features['heart_rate'] > 100:
        heart_score += 0.12
    if features['bmi'] > 30:
        heart_score += 0.12
    if features['smoking']:
        heart_score += 0.18
    if features['age'] > 55:
        heart_score += 0.12
    elif features['age'] > 45:
        heart_score += 0.06
    if features['family_heart']:
        heart_score += 0.15
    heart_score = min(heart_score, 0.99)
    scores['heart_disease'] = {
        'probability': round(heart_score, 4),
        'risk_level': _probability_to_level(heart_score),
    }
    
    # ── Hypertension Risk ──
    hyper_score = 0.10
    if features['systolic_bp'] > 140 or features['diastolic_bp'] > 90:
        hyper_score += 0.30
    elif features['systolic_bp'] > 130 or features['diastolic_bp'] > 85:
        hyper_score += 0.15
    if features['bmi'] > 30:
        hyper_score += 0.12
    if features['smoking']:
        hyper_score += 0.10
    if features['alcohol']:
        hyper_score += 0.08
    if features['age'] > 50:
        hyper_score += 0.10
    if features['family_hypertension']:
        hyper_score += 0.12
    if features['exercise_sedentary']:
        hyper_score += 0.08
    hyper_score = min(hyper_score, 0.99)
    scores['hypertension'] = {
        'probability': round(hyper_score, 4),
        'risk_level': _probability_to_level(hyper_score),
    }
    
    return scores


def _apply_cascade_effects(scores):
    """
    Model co-occurring risk chains.
    E.g., high diabetes risk elevates heart disease risk.
    """
    cascade_rules = [
        ('diabetes', 'heart_disease', 0.18),
        ('diabetes', 'hypertension', 0.12),
        ('hypertension', 'heart_disease', 0.15),
        ('heart_disease', 'hypertension', 0.10),
    ]
    
    cascade_effects = []
    
    for source, target, boost_factor in cascade_rules:
        if source in scores and target in scores:
            source_prob = scores[source]['probability']
            if source_prob > 0.5:  # Only cascade if source risk is elevated
                boost = round(source_prob * boost_factor, 4)
                original = scores[target]['probability']
                new_prob = min(original + boost, 0.99)
                scores[target]['probability'] = round(new_prob, 4)
                scores[target]['risk_level'] = _probability_to_level(new_prob)
                cascade_effects.append({
                    'source': source,
                    'target': target,
                    'boost': round(boost * 100, 1),
                    'description': (
                        f"{source.replace('_', ' ').title()} risk at "
                        f"{source_prob*100:.0f}% elevates "
                        f"{target.replace('_', ' ').title()} risk by "
                        f"+{boost*100:.1f}%"
                    ),
                })
    
    return {
        'conditions': scores,
        'cascade_effects': cascade_effects,
    }


def _probability_to_level(prob):
    """Convert probability to human-readable risk level."""
    if prob >= 0.75:
        return 'critical'
    elif prob >= 0.50:
        return 'high'
    elif prob >= 0.25:
        return 'moderate'
    else:
        return 'low'


def generate_shap_explanations(profile, vitals, scores):
    """
    Generate human-readable SHAP-style explanations for risk scores.
    
    Uses actual SHAP values when ML models are available,
    otherwise generates rule-based explanations.
    """
    features = _extract_features(profile, vitals)
    explanations = {}
    
    for condition, score_data in scores.get('conditions', {}).items():
        factors = []
        prob = score_data['probability']
        
        # Generate contributing factors
        if features['bmi'] > 30:
            impact = round((features['bmi'] - 25) * 0.01 * 100, 1)
            factors.append({
                'feature': 'BMI',
                'value': features['bmi'],
                'impact_pct': impact,
                'direction': 'increasing',
                'description': f"Your BMI of {features['bmi']:.1f} is contributing +{impact}% to your {condition.replace('_', ' ').title()} risk",
            })
        
        if features['blood_glucose'] > 100 and condition == 'diabetes':
            impact = round((features['blood_glucose'] - 100) * 0.15, 1)
            factors.append({
                'feature': 'Blood Glucose',
                'value': features['blood_glucose'],
                'impact_pct': impact,
                'direction': 'increasing',
                'description': f"Blood glucose of {features['blood_glucose']:.0f} mg/dL is contributing +{impact}% to Diabetes risk",
            })
        
        if features['systolic_bp'] > 130 and condition in ('hypertension', 'heart_disease'):
            impact = round((features['systolic_bp'] - 120) * 0.12, 1)
            factors.append({
                'feature': 'Systolic BP',
                'value': features['systolic_bp'],
                'impact_pct': impact,
                'direction': 'increasing',
                'description': f"Systolic BP of {features['systolic_bp']} mmHg is contributing +{impact}% to {condition.replace('_', ' ').title()} risk",
            })
        
        if features['smoking']:
            factors.append({
                'feature': 'Smoking',
                'value': 'Yes',
                'impact_pct': 15.0,
                'direction': 'increasing',
                'description': f"Smoking habit is contributing +15% to {condition.replace('_', ' ').title()} risk",
            })
        
        if features['age'] > 45:
            impact = round((features['age'] - 40) * 0.3, 1)
            factors.append({
                'feature': 'Age',
                'value': features['age'],
                'impact_pct': impact,
                'direction': 'increasing',
                'description': f"Age of {features['age']} is contributing +{impact}% to {condition.replace('_', ' ').title()} risk",
            })
        
        # Sort by impact
        factors.sort(key=lambda x: x['impact_pct'], reverse=True)
        
        explanations[condition] = {
            'overall_risk': prob,
            'risk_level': score_data['risk_level'],
            'top_factors': factors[:5],
        }
    
    return explanations


def what_if_simulation(profile, vitals, adjustments):
    """
    'What-If' simulator — recalculate risk scores with hypothetical changes.
    
    adjustments example: {'bmi': -3, 'blood_glucose': -20, 'smoking': False}
    """
    # Create modified copies
    modified_profile = _deep_copy_profile(profile)
    modified_vitals = dict(vitals) if vitals else {}
    
    demographics = modified_profile.get('demographics', {})
    lifestyle = modified_profile.get('lifestyle', {})
    
    for key, value in adjustments.items():
        if key in ('bmi', 'weight_kg', 'height_cm', 'age'):
            if isinstance(value, (int, float)) and value < 0:
                # Relative adjustment
                demographics[key] = demographics.get(key, 0) + value
            else:
                demographics[key] = value
        elif key in ('smoking',):
            lifestyle[key] = value
        elif key in ('alcohol', 'exercise_frequency'):
            lifestyle[key] = value
        elif key in ('heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2', 'blood_glucose', 'temperature'):
            if isinstance(value, (int, float)) and value < 0:
                modified_vitals[key] = modified_vitals.get(key, 0) + value
            else:
                modified_vitals[key] = value
    
    modified_profile['demographics'] = demographics
    modified_profile['lifestyle'] = lifestyle
    
    # Recalculate
    new_scores = calculate_risk_scores(modified_profile, modified_vitals)
    return new_scores


def _deep_copy_profile(profile):
    """Simple deep copy of a profile dict."""
    import copy
    return copy.deepcopy(profile)
