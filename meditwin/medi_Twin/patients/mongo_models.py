"""
MongoDB document schemas for patient health data.
These are not Django models — they define the MongoDB document structure
and provide helper functions for CRUD operations via PyMongo.
"""
from datetime import datetime, timezone
# type: ignore
from medi_Twin.mongo import get_collection


# ── Collection references ────────────────────────────────────────────
def health_profiles():
    return get_collection('health_profiles')


def vitals_history():
    return get_collection('vitals_history')


def lifestyle_logs():
    return get_collection('lifestyle_logs')


# ── Health Profile CRUD ──────────────────────────────────────────────

def create_health_profile(user_id, data):
    """Create the initial health profile after onboarding."""
    doc = {
        'user_id': user_id,
        'demographics': {
            'age': data.get('age'),
            'height_cm': data.get('height_cm'),
            'weight_kg': data.get('weight_kg'),
            'bmi': data.get('bmi'),
            'blood_type': data.get('blood_type', ''),
        },
        'family_history': data.get('family_history', []),
        'medical_conditions': data.get('medical_conditions', []),
        'medications': data.get('medications', []),
        'allergies': data.get('allergies', []),
        'lifestyle': {
            'smoking': data.get('smoking', False),
            'alcohol': data.get('alcohol', 'none'),
            'exercise_frequency': data.get('exercise_frequency', 'sedentary'),
            'diet_type': data.get('diet_type', 'mixed'),
        },
        'tour_completed': False,
        'achievements': [],
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
    }
    result = health_profiles().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_health_profile(user_id):
    """Retrieve the health profile for a given user."""
    profile = health_profiles().find_one({'user_id': user_id})
    if profile:
        profile['_id'] = str(profile['_id'])
    return profile


def update_health_profile(user_id, data):
    """Partially update the health profile."""
    data['updated_at'] = datetime.now(timezone.utc)
    health_profiles().update_one(
        {'user_id': user_id},
        {'$set': data}
    )
    return get_health_profile(user_id)


# ── Vitals CRUD ──────────────────────────────────────────────────────

def add_vitals_record(user_id, vitals_data):
    """
    Add a new vitals snapshot for a patient.
    Expected fields: heart_rate, systolic_bp, diastolic_bp,
    spo2, blood_glucose, temperature, respiratory_rate
    """
    doc = {
        'user_id': user_id,
        'heart_rate': vitals_data.get('heart_rate'),
        'systolic_bp': vitals_data.get('systolic_bp'),
        'diastolic_bp': vitals_data.get('diastolic_bp'),
        'spo2': vitals_data.get('spo2'),
        'blood_glucose': vitals_data.get('blood_glucose'),
        'temperature': vitals_data.get('temperature'),
        'respiratory_rate': vitals_data.get('respiratory_rate'),
        'recorded_at': datetime.now(timezone.utc),
    }
    result = vitals_history().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_vitals_history(user_id, limit=50):
    """Get recent vitals for a patient, newest first."""
    cursor = vitals_history().find(
        {'user_id': user_id}
    ).sort('recorded_at', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records


def get_latest_vitals(user_id):
    """Get the most recent vitals snapshot."""
    doc = vitals_history().find_one(
        {'user_id': user_id},
        sort=[('recorded_at', -1)]
    )
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc


# ── Lifestyle Logs CRUD ─────────────────────────────────────────────

def add_lifestyle_log(user_id, log_data):
    """Add a daily lifestyle log entry."""
    doc = {
        'user_id': user_id,
        'sleep_hours': log_data.get('sleep_hours'),
        'steps': log_data.get('steps'),
        'water_intake_ml': log_data.get('water_intake_ml'),
        'meals': log_data.get('meals', []),
        'stress_level': log_data.get('stress_level'),  # 1-10
        'exercise_minutes': log_data.get('exercise_minutes', 0),
        'notes': log_data.get('notes', ''),
        'date': log_data.get('date', datetime.now(timezone.utc).strftime('%Y-%m-%d')),
        'created_at': datetime.now(timezone.utc),
    }
    result = lifestyle_logs().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    
    # Evaluate achievements after logging
    evaluate_and_award_badges(user_id)
    
    return doc


def evaluate_and_award_badges(user_id):
    """Evaluate lifestyle logs and award badges if criteria are met."""
    profile = get_health_profile(user_id)
    if not profile:
        return []

    earned_badges = profile.get('achievements', [])
    new_badges = []
    
    # Check if they have at least one log
    logs = get_lifestyle_logs(user_id, limit=5)
    if logs:
        if 'First Step' not in earned_badges:
            new_badges.append('First Step')
            
        latest_log = logs[0]
        # Hydration Hero: Water intake >= 2500 ml
        if latest_log.get('water_intake_ml', 0) >= 2500 and 'Hydration Hero' not in earned_badges:
            new_badges.append('Hydration Hero')
            
        # Step Master: Steps >= 10000
        if latest_log.get('steps', 0) >= 10000 and 'Step Master' not in earned_badges:
            new_badges.append('Step Master')
            
        # Sleep Champion: Sleep hours >= 7
        if latest_log.get('sleep_hours', 0) >= 7 and 'Sleep Champion' not in earned_badges:
            new_badges.append('Sleep Champion')
            
        # Zen Master: Stress level <= 3
        stress = latest_log.get('stress_level')
        if stress is not None and stress <= 3 and 'Zen Master' not in earned_badges:
            new_badges.append('Zen Master')

    if new_badges:
        earned_badges.extend(new_badges)
        health_profiles().update_one(
            {'user_id': user_id},
            {'$set': {'achievements': earned_badges}}
        )
    
    return new_badges


def get_lifestyle_logs(user_id, limit=30):
    """Get recent lifestyle logs for a patient."""
    cursor = lifestyle_logs().find(
        {'user_id': user_id}
    ).sort('date', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records
