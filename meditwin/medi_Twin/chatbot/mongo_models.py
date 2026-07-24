"""
MongoDB helpers for chatbot sessions and symptom logs.
"""
from datetime import datetime, timezone
from bson import ObjectId
from medi_Twin.mongo import get_collection


def chatbot_sessions():
    return get_collection('chatbot_sessions')


def create_session(user_id):
    """Create a new chatbot session."""
    doc = {
        'user_id': user_id,
        'messages': [],
        'symptoms_logged': [],
        'triage_severity': None,  # low / moderate / urgent / emergency
        'status': 'active',
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
    }
    result = chatbot_sessions().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_active_session(user_id):
    """Get the most recent active session for a user."""
    doc = chatbot_sessions().find_one(
        {'user_id': user_id, 'status': 'active'},
        sort=[('created_at', -1)]
    )
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc


def add_message(session_id, role, content, metadata=None):
    """
    Append a message to a chatbot session.
    role: 'user' | 'bot'
    """
    message = {
        'role': role,
        'content': content,
        'timestamp': datetime.now(timezone.utc),
        'metadata': metadata or {},
    }
    chatbot_sessions().update_one(
        {'_id': ObjectId(session_id)},
        {
            '$push': {'messages': message},
            '$set': {'updated_at': datetime.now(timezone.utc)},
        }
    )
    return message


def log_symptom(session_id, symptom):
    """Add a symptom to the session's symptom log."""
    chatbot_sessions().update_one(
        {'_id': ObjectId(session_id)},
        {
            '$addToSet': {'symptoms_logged': symptom},
            '$set': {'updated_at': datetime.now(timezone.utc)},
        }
    )


def update_triage_severity(session_id, severity):
    """Update the triage severity level for a session."""
    chatbot_sessions().update_one(
        {'_id': ObjectId(session_id)},
        {
            '$set': {
                'triage_severity': severity,
                'updated_at': datetime.now(timezone.utc),
            }
        }
    )


def close_session(session_id):
    """Mark a chatbot session as closed."""
    chatbot_sessions().update_one(
        {'_id': ObjectId(session_id)},
        {
            '$set': {
                'status': 'closed',
                'updated_at': datetime.now(timezone.utc),
            }
        }
    )


def get_session_history(user_id, limit=10):
    """Get recent chatbot sessions for a user."""
    cursor = chatbot_sessions().find(
        {'user_id': user_id}
    ).sort('created_at', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records


def get_previous_symptoms(user_id):
    """
    Aggregate all symptoms from previous sessions.
    Used for symptom memory — "Last time you mentioned chest pain."
    """
    pipeline = [
        {'$match': {'user_id': user_id}},
        {'$sort': {'created_at': -1}},
        {'$limit': 5},
        {'$unwind': '$symptoms_logged'},
        {'$group': {
            '_id': '$symptoms_logged',
            'last_reported': {'$first': '$updated_at'},
        }},
        {'$sort': {'last_reported': -1}},
    ]
    cursor = chatbot_sessions().aggregate(pipeline)
    return list(cursor)
