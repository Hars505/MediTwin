"""
Patient health profile, vitals, and lifestyle API views.

Endpoints:
  GET/POST   /api/patient/profile/        — health profile
  POST       /api/patient/vitals/         — record new vitals
  GET        /api/patient/vitals/         — vitals history
  GET        /api/patient/vitals/latest/  — latest vitals
  POST       /api/patient/lifestyle/      — add lifestyle log
  GET        /api/patient/lifestyle/      — lifestyle log history
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .serializers import (
    HealthProfileSerializer,
    VitalsSerializer,
    LifestyleLogSerializer,
)
from . import mongo_models


def _safe_int_limit(request, param='limit', default=50, max_val=100):
    """Safely parse integer query parameter within [1, max_val]."""
    try:
        val = int(request.query_params.get(param, default))
        return max(1, min(val, max_val))
    except (ValueError, TypeError):
        return default


class HealthProfileView(APIView):
    """
    GET  — Retrieve the authenticated patient's health profile.
    POST — Create or update the health profile (onboarding).
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        profile = mongo_models.get_health_profile(request.user.id)
        if not profile:
            return Response(
                {"detail": "Health profile not found. Complete onboarding first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(profile)

    def post(self, request):
        serializer = HealthProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        existing = mongo_models.get_health_profile(request.user.id)
        if existing:
            profile = mongo_models.update_health_profile(
                request.user.id, data
            )
            msg = "Health profile updated."
        else:
            profile = mongo_models.create_health_profile(
                request.user.id, data
            )
            # Mark onboarding complete
            request.user.onboarding_complete = True
            request.user.save(update_fields=['onboarding_complete'])
            msg = "Health profile created. Onboarding complete!"

        return Response(
            {"message": msg, "profile": profile},
            status=status.HTTP_200_OK,
        )


class VitalsView(APIView):
    """
    POST — Record a new vitals snapshot (triggers risk recalculation).
    GET  — Retrieve vitals history for the patient.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = VitalsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = mongo_models.add_vitals_record(
            request.user.id, serializer.validated_data
        )

        # Auto-trigger risk recalculation (lazy imports to avoid circular dependency)
        risk_data = None
        profile = mongo_models.get_health_profile(request.user.id)
        if profile:
            # pyrefly: ignore [missing-import]
            from ml_engine.predictor import calculate_risk_scores, generate_shap_explanations
            # pyrefly: ignore [missing-import]
            from ml_engine.mongo_models import save_risk_scores
            scores = calculate_risk_scores(profile, record)
            explanations = generate_shap_explanations(profile, record, scores)
            save_risk_scores(
                user_id=request.user.id,
                scores_dict=scores.get('conditions', {}),
                shap_explanations=explanations,
            )
            risk_data = scores

        return Response(
            {
                "message": "Vitals recorded.",
                "vitals": record,
                "risk_scores": risk_data,
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        limit = _safe_int_limit(request, 'limit', default=50, max_val=100)
        records = mongo_models.get_vitals_history(request.user.id, limit)
        return Response(records)


class LatestVitalsView(APIView):
    """GET — Retrieve the most recent vitals snapshot."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        vitals = mongo_models.get_latest_vitals(request.user.id)
        if not vitals:
            return Response(
                {"detail": "No vitals recorded yet."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(vitals)


class LifestyleLogView(APIView):
    """
    POST — Add a daily lifestyle log entry.
    GET  — Retrieve lifestyle log history.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = LifestyleLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        log = mongo_models.add_lifestyle_log(
            request.user.id, serializer.validated_data
        )
        profile = mongo_models.get_health_profile(request.user.id)
        earned_badges = profile.get('achievements', []) if profile else []
        return Response(
            {"message": "Lifestyle log saved.", "log": log, "achievements": earned_badges},
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        limit = _safe_int_limit(request, 'limit', default=30, max_val=100)
        logs = mongo_models.get_lifestyle_logs(request.user.id, limit)
        return Response(logs)


class TourCompleteView(APIView):
    """POST — Mark the onboarding tour as completed."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        mongo_models.health_profiles().update_one(
            {'user_id': request.user.id},
            {'$set': {'tour_completed': True}}
        )
        return Response({"message": "Tour marked as completed."}, status=status.HTTP_200_OK)

