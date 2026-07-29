from medi_Twin.mongo import get_database


def setup():
    db = get_database()
    COLLECTIONS = [
        ('health_profiles', [
            'user_id',
        ]),
        ('vitals_history', [
            'user_id',
            [('user_id', 1), ('recorded_at', -1)],
        ]),
        ('lifestyle_logs', [
            'user_id',
            [('user_id', 1), ('date', -1)],
        ]),
        ('risk_scores', [
            'user_id',
            [('user_id', 1), ('calculated_at', -1)],
        ]),
        ('chatbot_sessions', [
            'user_id',
            [('user_id', 1), ('status', 1), ('created_at', -1)],
        ]),
        ('reports', [
            'patient_id',
            'doctor_id',
            [('patient_id', 1), ('generated_at', -1)],
        ]),
        ('appointments', [
            'patient_id',
            'doctor_id',
            [('doctor_id', 1), ('scheduled_at', 1)],
        ]),
        ('anomaly_events', [
            'user_id',
            [('user_id', 1), ('detected_at', -1)],
        ]),
        ('model_metrics', [
            'model_name',
            [('model_name', 1), ('recorded_at', -1)],
        ]),
        ('medical_qa', []),
        ('doctor_profiles', [
            'user_id',
            'specialization',
        ]),
        ('notifications', [
            'user_id',
            [('user_id', 1), ('read', 1), ('created_at', -1)],
        ]),
        ('audit_logs', [
            'user_id',
            'action',
            [('user_id', 1), ('timestamp', -1)],
        ]),
    ]
    for name, indexes in COLLECTIONS:
        if name not in db.list_collection_names():
            db.create_collection(name)
        coll = db[name]
        for idx in indexes:
            if isinstance(idx, list):
                coll.create_index(idx)
            else:
                coll.create_index(idx)
    print(f"✅ {len(COLLECTIONS)} collections initialized in meditwin_db!")