"""
ML Engine API views.

Endpoints:
  GET  /api/ml/risk-scores/           — get latest risk scores
  POST /api/ml/risk-scores/calculate/ — trigger risk calculation
  GET  /api/ml/risk-scores/history/   — risk score trend data
  POST /api/ml/what-if/               — What-If simulator
  GET  /api/ml/model-metrics/         — admin: model performance stats
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import ScopedRateThrottle

from . import mongo_models
from .predictor import (
    calculate_risk_scores,
    generate_shap_explanations,
    what_if_simulation,
)


def _safe_int_limit(request, param='limit', default=20, max_val=100):
    """Safely parse integer query parameter within [1, max_val]."""
    try:
        val = int(request.query_params.get(param, default))
        return max(1, min(val, max_val))
    except (ValueError, TypeError):
        return default


class RiskScoresView(APIView):
    """GET — retrieve latest risk scores for the authenticated patient."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        scores = mongo_models.get_latest_risk_scores(request.user.id)
        if not scores:
            return Response(
                {"detail": "No risk scores calculated yet. Submit vitals first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(scores)


class CalculateRiskView(APIView):
    """
    POST — trigger a new risk score calculation.
    Uses the patient's health profile + latest vitals.
    Returns scores with SHAP explanations.
    """
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'sensitive'

    def post(self, request):
        # pyrefly: ignore [missing-import]
        from patients.mongo_models import get_health_profile, get_latest_vitals
        profile = get_health_profile(request.user.id)
        if not profile:
            return Response(
                {"detail": "Health profile not found. Complete onboarding."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vitals = get_latest_vitals(request.user.id)

        # Calculate risk scores
        scores = calculate_risk_scores(profile, vitals)

        # Generate SHAP explanations
        explanations = generate_shap_explanations(profile, vitals, scores)

        # Persist to MongoDB
        saved = mongo_models.save_risk_scores(
            user_id=request.user.id,
            scores_dict=scores.get('conditions', {}),
            shap_explanations=explanations,
        )

        return Response({
            "message": "Risk scores calculated.",
            "risk_scores": scores,
            "explanations": explanations,
            "record_id": saved['_id'],
        })


class RiskScoreHistoryView(APIView):
    """GET — risk score trend data for charts."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        limit = _safe_int_limit(request, 'limit', default=20, max_val=100)
        history = mongo_models.get_risk_score_history(
            request.user.id, limit
        )
        return Response(history)


class WhatIfView(APIView):
    """
    POST — What-If simulator.
    Accepts hypothetical adjustments and returns recalculated risk scores.
    
    Body example:
    {
        "adjustments": {"bmi": -3, "blood_glucose": -20, "smoking": false}
    }
    """
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'sensitive'

    def post(self, request):
        # type: ignore
        from patients.mongo_models import get_health_profile, get_latest_vitals
        profile = get_health_profile(request.user.id)
        if not profile:
            return Response(
                {"detail": "Health profile not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vitals = get_latest_vitals(request.user.id)
        adjustments = request.data.get('adjustments', {})

        if not isinstance(adjustments, dict) or not adjustments:
            return Response(
                {"detail": "Provide a valid 'adjustments' object in request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(adjustments) > 20:
            return Response(
                {"detail": "Too many adjustment parameters (max 20)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate adjustment value types (int, float, bool)
        sanitized_adjustments = {}
        for k, v in adjustments.items():
            if isinstance(v, (int, float, bool)):
                sanitized_adjustments[str(k)] = v

        # Get current scores for comparison
        current_scores = calculate_risk_scores(profile, vitals)

        # Simulate with adjustments
        simulated_scores = what_if_simulation(profile, vitals, sanitized_adjustments)

        return Response({
            "current": current_scores,
            "simulated": simulated_scores,
            "adjustments_applied": sanitized_adjustments,
        })


class ModelMetricsView(APIView):
    """GET — admin-only: ML model performance metrics."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        # Only admin users can view model metrics
        if not request.user.is_admin_user:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        model_name = request.query_params.get('model', None)
        metrics = mongo_models.get_model_metrics(model_name)
        return Response(metrics)

