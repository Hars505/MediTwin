"""
Chatbot API views.

Endpoints:
  POST   /api/chatbot/session/   — start a new session (or resume active one)
  POST   /api/chatbot/message/   — send a user message, get medical QA reply
  GET    /api/chatbot/history/   — recent session history
  GET    /api/chatbot/symptoms/  — aggregated previous symptoms (memory)

Uses the lavita/medical-qa-datasets via TF-IDF retrieval for answers.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import ScopedRateThrottle

from .mongo_models import (
    create_session,
    get_active_session,
    add_message,
    log_symptom,
    get_session_history,
    get_previous_symptoms,
)
from .qa_engine import find_best_answer, get_dataset_stats


# ── Symptom extraction ───────────────────────────────────────────────

SYMPTOM_KEYWORDS = [
    'chest pain', 'shortness of breath', 'sore throat',
    'headache', 'fever', 'cough', 'fatigue', 'nausea',
    'dizziness', 'pain', 'vomiting', 'diarrhea', 'rash',
    'swelling', 'bleeding', 'numbness', 'tingling',
    'weight loss', 'weight gain', 'insomnia', 'anxiety',
    'palpitations', 'blurred vision', 'back pain',
    'abdominal pain', 'joint pain', 'muscle pain',
]


def extract_symptoms(text):
    """Extract known symptom keywords from user text."""
    lowered = str(text).lower()
    found = []
    for kw in SYMPTOM_KEYWORDS:
        if kw in lowered:
            found.append(kw)
    return list(set(found))


def _safe_int_limit(request, param='limit', default=5, max_val=50):
    """Safely parse integer query parameter within [1, max_val]."""
    try:
        val = int(request.query_params.get(param, default))
        return max(1, min(val, max_val))
    except (ValueError, TypeError):
        return default


# ── Views ────────────────────────────────────────────────────────────

class StartSessionView(APIView):
    """Create a new chatbot session or return the existing active one."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        active = get_active_session(request.user.id)
        if active:
            return Response({
                "session_id": active['_id'],
                "message": "Resumed existing session.",
            })
        new_session = create_session(request.user.id)
        return Response({
            "session_id": new_session['_id'],
            "message": "New session started.",
        }, status=status.HTTP_201_CREATED)


class SendMessageView(APIView):
    """
    Accept a user message, find the best medical answer from the dataset,
    log any detected symptoms, and return the reply.
    """
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'sensitive'

    def post(self, request):
        session_id = request.data.get('session_id')
        raw_msg = request.data.get('message')
        if not session_id or not raw_msg:
            return Response(
                {"detail": "session_id and message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Truncate input string to max 2000 chars to avoid prompt injection / memory blowup
        user_msg = str(raw_msg).strip()[:2000]
        if not user_msg:
            return Response(
                {"detail": "Message cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save user message
        add_message(session_id, role='user', content=user_msg)

        # Extract and log symptoms
        symptoms = extract_symptoms(user_msg)
        for s in symptoms:
            log_symptom(session_id, s)

        # Find answer from medical QA dataset
        result = find_best_answer(user_msg)

        if result and result['confidence'] > 0.1:
            bot_reply = result['answer']
            metadata = {
                'source': 'generative-llm',
                'model': 'medllama2',
                'confidence': result['confidence'],
            }
        else:
            bot_reply = (
                "I couldn't find a specific medical answer for your question. "
                "Please consult a healthcare professional for accurate advice."
            )
            metadata = {'source': 'fallback', 'confidence': 0}

        # Save bot reply
        add_message(session_id, role='bot', content=bot_reply, metadata=metadata)

        return Response({
            "reply": bot_reply,
            "confidence": metadata.get('confidence', 0),
            "symptoms_logged": symptoms,
        })


class SessionHistoryView(APIView):
    """Return recent chatbot sessions for the authenticated user."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        limit = _safe_int_limit(request, 'limit', default=5, max_val=50)
        history = get_session_history(request.user.id, limit)
        return Response(history)


class SymptomMemoryView(APIView):
    """Return aggregated previous symptoms for the user."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        symptoms = get_previous_symptoms(request.user.id)
        formatted = [
            {
                'symptom': doc['_id'],
                'last_reported': str(doc['last_reported']),
            }
            for doc in symptoms
        ]
        return Response(formatted)


class DatasetStatsView(APIView):
    """GET — check if the medical QA dataset is loaded and indexed."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        stats = get_dataset_stats()
        return Response(stats)
