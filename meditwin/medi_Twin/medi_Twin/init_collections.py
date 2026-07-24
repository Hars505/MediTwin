"""
MongoDB collection initializer for MediTwin.

Creates all collections with:
  - Schema validation (enforces required fields and types)
  - Indexes on PKs and FKs for fast lookups
  - user_id as the FK linking to Django's auth_user table

Run once after MongoDB is ready:
    python manage.py shell -c "from medi_Twin.init_collections import setup; setup()"
"""
from medi_Twin.mongo import get_database


def setup():
    """Create all MediTwin collections with validation and indexes."""
    db = get_database()

    # ════════════════════════════════════════════════════════════════
    # 1. health_profiles  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'health_profiles' not in db.list_collection_names():
        db.create_collection('health_profiles', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'demographics', 'created_at'],
                'properties': {
                    'user_id':      {'bsonType': 'objectId', 'description': 'FK → users.id (patient)'},
                    'demographics': {
                        'bsonType': 'object',
                        'properties': {
                            'age':        {'bsonType': 'int'},
                            'height_cm':  {'bsonType': 'double'},
                            'weight_kg':  {'bsonType': 'double'},
                            'bmi':        {'bsonType': 'double'},
                            'blood_type': {'bsonType': 'string'},
                        },
                    },
                    'family_history':     {'bsonType': 'array'},
                    'medical_conditions': {'bsonType': 'array'},
                    'medications':        {'bsonType': 'array'},
                    'allergies':          {'bsonType': 'array'},
                    'lifestyle': {
                        'bsonType': 'object',
                        'properties': {
                            'smoking':            {'bsonType': 'bool'},
                            'alcohol':            {'bsonType': 'string'},
                            'exercise_frequency': {'bsonType': 'string'},
                            'diet_type':          {'bsonType': 'string'},
                        },
                    },
                    'created_at': {'bsonType': 'date'},
                    'updated_at': {'bsonType': 'date'},
                },
            }
        })
    hp = db['health_profiles']
    hp.create_index('user_id', unique=True, name='idx_hp_user_id')
    print("✅ health_profiles — created with unique index on user_id")

    # ════════════════════════════════════════════════════════════════
    # 2. vitals_history  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'vitals_history' not in db.list_collection_names():
        db.create_collection('vitals_history', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'recorded_at'],
                'properties': {
                    'user_id':          {'bsonType': 'objectId', 'description': 'FK → users.id (patient)'},
                    'heart_rate':       {'bsonType': 'int'},
                    'systolic_bp':      {'bsonType': 'int'},
                    'diastolic_bp':     {'bsonType': 'int'},
                    'spo2':             {'bsonType': 'double'},
                    'blood_glucose':    {'bsonType': 'double'},
                    'temperature':      {'bsonType': 'double'},
                    'respiratory_rate': {'bsonType': 'int'},
                    'recorded_at':      {'bsonType': 'date'},
                },
            }
        })
    vh = db['vitals_history']
    vh.create_index('user_id', name='idx_vitals_user_id')
    vh.create_index([('user_id', 1), ('recorded_at', -1)], name='idx_vitals_user_date')
    print("✅ vitals_history — created with indexes on user_id and (user_id, recorded_at)")

    # ════════════════════════════════════════════════════════════════
    # 3. lifestyle_logs  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'lifestyle_logs' not in db.list_collection_names():
        db.create_collection('lifestyle_logs', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'date'],
                'properties': {
                    'user_id':         {'bsonType': 'objectId', 'description': 'FK → users.id (patient)'},
                    'sleep_hours':     {'bsonType': 'double'},
                    'steps':           {'bsonType': 'int'},
                    'water_intake_ml': {'bsonType': 'int'},
                    'meals':           {'bsonType': 'array'},
                    'stress_level':    {'bsonType': 'int'},
                    'exercise_minutes':{'bsonType': 'int'},
                    'notes':           {'bsonType': 'string'},
                    'date':            {'bsonType': 'string'},
                    'created_at':      {'bsonType': 'date'},
                },
            }
        })
    ll = db['lifestyle_logs']
    ll.create_index('user_id', name='idx_lifestyle_user_id')
    ll.create_index([('user_id', 1), ('date', -1)], name='idx_lifestyle_user_date')
    print("✅ lifestyle_logs — created with indexes on user_id and (user_id, date)")

    # ════════════════════════════════════════════════════════════════
    # 4. risk_scores  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'risk_scores' not in db.list_collection_names():
        db.create_collection('risk_scores', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'scores', 'calculated_at'],
                'properties': {
                    'user_id':           {'bsonType': 'objectId', 'description': 'FK → users.id (patient)'},
                    'scores':            {'bsonType': 'object', 'description': 'Per-condition risk scores'},
                    'shap_explanations': {'bsonType': 'object'},
                    'calculated_at':     {'bsonType': 'date'},
                },
            }
        })
    rs = db['risk_scores']
    rs.create_index('user_id', name='idx_risk_user_id')
    rs.create_index([('user_id', 1), ('calculated_at', -1)], name='idx_risk_user_date')
    print("✅ risk_scores — created with indexes on user_id and (user_id, calculated_at)")

    # ════════════════════════════════════════════════════════════════
    # 5. chatbot_sessions  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'chatbot_sessions' not in db.list_collection_names():
        db.create_collection('chatbot_sessions', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'status', 'created_at'],
                'properties': {
                    'user_id':         {'bsonType': 'objectId', 'description': 'FK → users.id (patient)'},
                    'messages':        {'bsonType': 'array'},
                    'symptoms_logged': {'bsonType': 'array'},
                    'triage_severity': {'bsonType': ['string', 'null']},
                    'status':          {'bsonType': 'string', 'enum': ['active', 'closed']},
                    'created_at':      {'bsonType': 'date'},
                    'updated_at':      {'bsonType': 'date'},
                },
            }
        })
    cs = db['chatbot_sessions']
    cs.create_index('user_id', name='idx_chatbot_user_id')
    cs.create_index([('user_id', 1), ('status', 1), ('created_at', -1)],
                    name='idx_chatbot_user_status_date')
    print("✅ chatbot_sessions — created with indexes on user_id and (user_id, status, created_at)")

    # ════════════════════════════════════════════════════════════════
    # 6. reports  (FK: patient_id → users.id, doctor_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'reports' not in db.list_collection_names():
        db.create_collection('reports', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['patient_id', 'filename', 'generated_at'],
                'properties': {
                    'patient_id':   {'bsonType': 'objectId', 'description': 'FK → users.id (patient)'},
                    'doctor_id':    {'bsonType': ['objectId', 'null'], 'description': 'FK → users.id (doctor, nullable)'},
                    'filename':     {'bsonType': 'string'},
                    'report_type':  {'bsonType': 'string', 'enum': ['full', 'summary', 'vitals', 'risk']},
                    'notes':        {'bsonType': 'string'},
                    'generated_at': {'bsonType': 'date'},
                },
            }
        })
    rp = db['reports']
    rp.create_index('patient_id', name='idx_report_patient_id')
    rp.create_index('doctor_id', name='idx_report_doctor_id')
    rp.create_index([('patient_id', 1), ('generated_at', -1)], name='idx_report_patient_date')
    print("✅ reports — created with indexes on patient_id, doctor_id, and (patient_id, generated_at)")

    # ════════════════════════════════════════════════════════════════
    # 7. appointments  (FK: patient_id → users.id, doctor_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'appointments' not in db.list_collection_names():
        db.create_collection('appointments', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['patient_id', 'doctor_id', 'status', 'scheduled_at'],
                'properties': {
                    'patient_id':    {'bsonType': 'objectId', 'description': 'FK → users.id (patient)'},
                    'doctor_id':     {'bsonType': 'objectId', 'description': 'FK → users.id (doctor)'},
                    'status':        {'bsonType': 'string', 'enum': ['pending', 'confirmed', 'completed', 'cancelled']},
                    'scheduled_at':  {'bsonType': 'date'},
                    'consultation_notes': {'bsonType': 'string'},
                    'risk_snapshot': {'bsonType': 'object', 'description': 'Risk scores at time of booking'},
                    'created_at':    {'bsonType': 'date'},
                },
            }
        })
    ap = db['appointments']
    ap.create_index('patient_id', name='idx_appt_patient_id')
    ap.create_index('doctor_id', name='idx_appt_doctor_id')
    ap.create_index([('doctor_id', 1), ('scheduled_at', 1)], name='idx_appt_doctor_schedule')
    print("✅ appointments — created with indexes on patient_id, doctor_id")

    # ════════════════════════════════════════════════════════════════
    # 8. anomaly_events  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'anomaly_events' not in db.list_collection_names():
        db.create_collection('anomaly_events', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'vital_type', 'detected_at'],
                'properties': {
                    'user_id':     {'bsonType': 'objectId', 'description': 'FK → users.id (patient)'},
                    'vital_type':  {'bsonType': 'string', 'description': 'e.g. heart_rate, spo2'},
                    'value':       {'bsonType': 'double'},
                    'threshold':   {'bsonType': 'double'},
                    'severity':    {'bsonType': 'string', 'enum': ['warning', 'critical']},
                    'resolved':    {'bsonType': 'bool'},
                    'detected_at': {'bsonType': 'date'},
                },
            }
        })
    ae = db['anomaly_events']
    ae.create_index('user_id', name='idx_anomaly_user_id')
    ae.create_index([('user_id', 1), ('detected_at', -1)], name='idx_anomaly_user_date')
    print("✅ anomaly_events — created with indexes on user_id and (user_id, detected_at)")

    # ════════════════════════════════════════════════════════════════
    # 9. model_metrics  (no FK — tracks ML model performance)
    # ════════════════════════════════════════════════════════════════
    if 'model_metrics' not in db.list_collection_names():
        db.create_collection('model_metrics', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['model_name', 'recorded_at'],
                'properties': {
                    'model_name':   {'bsonType': 'string'},
                    'accuracy':     {'bsonType': 'double'},
                    'auc_roc':      {'bsonType': 'double'},
                    'f1_score':     {'bsonType': 'double'},
                    'precision':    {'bsonType': 'double'},
                    'recall':       {'bsonType': 'double'},
                    'dataset_size': {'bsonType': 'int'},
                    'recorded_at':  {'bsonType': 'date'},
                },
            }
        })
    mm = db['model_metrics']
    mm.create_index('model_name', name='idx_metrics_model')
    mm.create_index([('model_name', 1), ('recorded_at', -1)], name='idx_metrics_model_date')
    print("✅ model_metrics — created with indexes on model_name")

    # ════════════════════════════════════════════════════════════════
    # 10. medical_qa  (standalone — chatbot knowledge base)
    # ════════════════════════════════════════════════════════════════
    if 'medical_qa' not in db.list_collection_names():
        db.create_collection('medical_qa')
    mq = db['medical_qa']
    try:
        mq.create_index([('question', 'text')], name='idx_qa_text')
    except Exception as e:
        print(f"⚠️  medical_qa index notice: {e}")
    print("✅ medical_qa — text index verified on question")

    # ════════════════════════════════════════════════════════════════
    # 11. doctor_profiles  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'doctor_profiles' not in db.list_collection_names():
        db.create_collection('doctor_profiles', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'specialization', 'created_at'],
                'properties': {
                    'user_id':              {'bsonType': 'objectId', 'description': 'FK → users.id (doctor)'},
                    'specialization':       {'bsonType': 'string'},
                    'license_number':       {'bsonType': 'string'},
                    'department':           {'bsonType': 'string'},
                    'years_of_experience':  {'bsonType': 'int'},
                    'consultation_fee':     {'bsonType': 'double'},
                    'bio':                  {'bsonType': 'string'},
                    'available_slots':      {'bsonType': 'array', 'description': 'Array of {day, start_time, end_time}'},
                    'assigned_patients':    {'bsonType': 'array', 'description': 'Array of patient user_ids'},
                    'created_at':           {'bsonType': 'date'},
                    'updated_at':           {'bsonType': 'date'},
                },
            }
        })
    dp = db['doctor_profiles']
    dp.create_index('user_id', unique=True, name='idx_doctor_user_id')
    dp.create_index('specialization', name='idx_doctor_specialization')
    print("✅ doctor_profiles — created with unique index on user_id")

    # ════════════════════════════════════════════════════════════════
    # 12. notifications  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'notifications' not in db.list_collection_names():
        db.create_collection('notifications', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'type', 'title', 'created_at'],
                'properties': {
                    'user_id':    {'bsonType': 'objectId', 'description': 'FK → users.id'},
                    'type':       {'bsonType': 'string', 'enum': ['anomaly', 'appointment', 'report', 'system']},
                    'title':      {'bsonType': 'string'},
                    'message':    {'bsonType': 'string'},
                    'severity':   {'bsonType': ['string', 'null'], 'description': 'warning | critical | info'},
                    'read':       {'bsonType': 'bool'},
                    'metadata':   {'bsonType': 'object', 'description': 'Extra context (vital_type, value, etc.)'},
                    'created_at': {'bsonType': 'date'},
                },
            }
        })
    nt = db['notifications']
    nt.create_index('user_id', name='idx_notif_user_id')
    nt.create_index([('user_id', 1), ('read', 1), ('created_at', -1)],
                    name='idx_notif_user_read_date')
    print("✅ notifications — created with indexes on user_id and (user_id, read, created_at)")

    # ════════════════════════════════════════════════════════════════
    # 13. audit_logs  (FK: user_id → users.id)
    # ════════════════════════════════════════════════════════════════
    if 'audit_logs' not in db.list_collection_names():
        db.create_collection('audit_logs', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['user_id', 'action', 'timestamp'],
                'properties': {
                    'user_id':    {'bsonType': 'objectId', 'description': 'FK → users.id'},
                    'action':     {'bsonType': 'string', 'description': 'login, logout, register, vitals_recorded, report_generated, profile_updated'},
                    'ip_address': {'bsonType': ['string', 'null']},
                    'user_agent': {'bsonType': ['string', 'null']},
                    'details':    {'bsonType': 'object', 'description': 'Additional action-specific data'},
                    'timestamp':  {'bsonType': 'date'},
                },
            }
        })
    al = db['audit_logs']
    al.create_index('user_id', name='idx_audit_user_id')
    al.create_index([('user_id', 1), ('timestamp', -1)], name='idx_audit_user_time')
    al.create_index('action', name='idx_audit_action')
    print("✅ audit_logs — created with indexes on user_id, action, and (user_id, timestamp)")

    print("\n🎉 All 13 collections initialized in meditwin_db!")
    print("   Open MongoDB Compass → connect to mongodb://localhost:27017 → meditwin_db")


if __name__ == '__main__':
    setup()

