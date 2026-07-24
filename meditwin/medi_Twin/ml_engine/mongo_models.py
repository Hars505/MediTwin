"""
MongoDB helpers for risk scores and model metrics.
"""
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from medi_Twin.mongo import get_collection


def risk_scores():
    return get_collection('risk_scores')


def model_metrics():
    return get_collection('model_metrics')


def save_risk_scores(user_id, scores_dict, shap_explanations=None):
    """
    Save a complete risk score calculation for a patient.
    
    scores_dict example:
    {
        'diabetes': {'probability': 0.72, 'risk_level': 'high'},
        'heart_disease': {'probability': 0.45, 'risk_level': 'moderate'},
        'hypertension': {'probability': 0.60, 'risk_level': 'high'},
    }
    """
    doc = {
        'user_id': user_id,
        'scores': scores_dict,
        'shap_explanations': shap_explanations or {},
        'calculated_at': datetime.now(timezone.utc),
    }
    result = risk_scores().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_latest_risk_scores(user_id):
    """Get the most recent risk scores for a patient."""
    doc = risk_scores().find_one(
        {'user_id': user_id},
        sort=[('calculated_at', -1)]
    )
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc


def get_risk_score_history(user_id, limit=20):
    """Get risk score history for trend analysis."""
    cursor = risk_scores().find(
        {'user_id': user_id}
    ).sort('calculated_at', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records


def save_model_metric(model_name, metrics_data):
    """Log ML model performance metrics."""
    doc = {
        'model_name': model_name,
        'accuracy': metrics_data.get('accuracy'),
        'auc_roc': metrics_data.get('auc_roc'),
        'f1_score': metrics_data.get('f1_score'),
        'precision': metrics_data.get('precision'),
        'recall': metrics_data.get('recall'),
        'dataset_size': metrics_data.get('dataset_size'),
        'recorded_at': datetime.now(timezone.utc),
    }
    result = model_metrics().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_model_metrics(model_name=None, limit=10):
    """Get model performance metrics, optionally filtered by model name."""
    query = {}
    if model_name:
        query['model_name'] = model_name
    cursor = model_metrics().find(query).sort('recorded_at', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records
