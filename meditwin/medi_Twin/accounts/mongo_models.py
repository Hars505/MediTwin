"""
MongoDB helpers for doctor profiles, notifications, and audit logging.
These complement the Django User model (SQLite) with MongoDB document storage.
"""
from datetime import datetime, timezone
from bson import ObjectId
from medi_Twin.mongo import get_collection


# ── Collection references ────────────────────────────────────────────

def doctor_profiles():
    return get_collection('doctor_profiles')


def users():
    """Collection for storing MongoDB-side user login/signup data."""
    return get_collection('users')


def notifications():
    return get_collection('notifications')


def audit_logs():
    return get_collection('audit_logs')


# ══════════════════════════════════════════════════════════════════════
# Doctor Profile CRUD
# ══════════════════════════════════════════════════════════════════════

def create_doctor_profile(user_id, data):
    """Create a doctor profile after registration."""
    doc = {
        'user_id': user_id,
        'specialization': data.get('specialization', ''),
        'license_number': data.get('license_number', ''),
        'department': data.get('department', ''),
        'years_of_experience': data.get('years_of_experience', 0),
        'consultation_fee': data.get('consultation_fee', 0.0),
        'bio': data.get('bio', ''),
        'available_slots': data.get('available_slots', []),
        'assigned_patients': data.get('assigned_patients', []),
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
    }
    result = doctor_profiles().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_doctor_profile(user_id):
    """Retrieve the doctor profile for a given user."""
    profile = doctor_profiles().find_one({'user_id': user_id})
    if profile:
        profile['_id'] = str(profile['_id'])
    return profile


def update_doctor_profile(user_id, data):
    """Partially update the doctor profile."""
    data['updated_at'] = datetime.now(timezone.utc)
    doctor_profiles().update_one(
        {'user_id': user_id},
        {'$set': data}
    )
    return get_doctor_profile(user_id)


def get_all_doctors():
    """Get all doctor profiles (for patient-side doctor listing)."""
    cursor = doctor_profiles().find({})
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records


def assign_patient_to_doctor(doctor_user_id, patient_user_id):
    """Add a patient to a doctor's assigned_patients list."""
    doctor_profiles().update_one(
        {'user_id': doctor_user_id},
        {'$addToSet': {'assigned_patients': patient_user_id}}
    )


def get_assigned_patients(doctor_user_id):
    """Get list of patient user_ids assigned to a doctor."""
    profile = get_doctor_profile(doctor_user_id)
    if profile:
        return profile.get('assigned_patients', [])
    return []


# ══════════════════════════════════════════════════════════════════════
# Notifications CRUD
# ══════════════════════════════════════════════════════════════════════

def create_notification(user_id, notif_type, title, message='', severity=None, metadata=None):
    """Create an in-app notification."""
    doc = {
        'user_id': user_id,
        'type': notif_type,      # anomaly, appointment, report, system
        'title': title,
        'message': message,
        'severity': severity,     # warning, critical, info, or None
        'read': False,
        'metadata': metadata or {},
        'created_at': datetime.now(timezone.utc),
    }
    result = notifications().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_notifications(user_id, limit=50, unread_only=False):
    """Get notifications for a user, newest first."""
    query = {'user_id': user_id}
    if unread_only:
        query['read'] = False
    cursor = notifications().find(query).sort('created_at', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records


def get_unread_count(user_id):
    """Get the number of unread notifications."""
    return notifications().count_documents({'user_id': user_id, 'read': False})


def mark_notification_read(notification_id):
    """Mark a single notification as read."""
    notifications().update_one(
        {'_id': ObjectId(notification_id)},
        {'$set': {'read': True}}
    )


def mark_all_notifications_read(user_id):
    """Mark all notifications for a user as read."""
    notifications().update_many(
        {'user_id': user_id, 'read': False},
        {'$set': {'read': True}}
    )


# ══════════════════════════════════════════════════════════════════════
# Audit Logs
# ══════════════════════════════════════════════════════════════════════

def log_audit_event(user_id, action, ip_address=None, user_agent=None, details=None):
    """
    Log an audit event.
    
    Actions: login, logout, register, vitals_recorded,
             report_generated, profile_updated, password_changed
    """
    doc = {
        'user_id': user_id,
        'action': action,
        'ip_address': ip_address,
        'user_agent': user_agent,
        'details': details or {},
        'timestamp': datetime.now(timezone.utc),
    }
    result = audit_logs().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_audit_logs(user_id=None, action=None, limit=50):
    """Get audit logs, optionally filtered by user or action."""
    query = {}
    if user_id:
        query['user_id'] = user_id
    if action:
        query['action'] = action
    cursor = audit_logs().find(query).sort('timestamp', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records
