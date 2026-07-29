"""
Reports API views.

Endpoints:
  POST /api/reports/generate/             — generate a new PDF health report
  GET  /api/reports/                      — list reports (patient sees own, doctor sees assigned)
  GET  /api/reports/download/<filename>/  — download a report PDF
"""
import os
import re
from pathlib import Path
from django.conf import settings
from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import ScopedRateThrottle

from .generator import generate_health_report
from . import mongo_models
from bson import ObjectId
from medi_Twin.auth import QueryParamJWTAuthentication

FILENAME_SAFE_RE = re.compile(r"^[a-zA-Z0-9_\-]+\.pdf$")
ALLOWED_REPORT_TYPES = {'full', 'summary', 'vitals'}


class GenerateReportView(APIView):
    """POST — generate a PDF health report."""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'sensitive'

    def post(self, request):
        # type: ignore
        from patients.mongo_models import get_health_profile, get_vitals_history
        # type: ignore
        from ml_engine.mongo_models import get_latest_risk_scores

        # Determine which patient this report is for
        patient_id = request.data.get('patient_id', request.user.id)
        doctor_id = None

        # Validate report type and notes input
        report_type = request.data.get('report_type', 'full')
        if report_type not in ALLOWED_REPORT_TYPES:
            report_type = 'full'
        
        notes = str(request.data.get('notes', ''))[:500]

        if request.user.is_doctor:
            doctor_id = request.user.id
            # Convert string patient_id to ObjectId for MongoDB lookup
            if isinstance(patient_id, str):
                try:
                    patient_id = ObjectId(patient_id)
                except Exception:
                    return Response(
                        {"detail": "Invalid patient ID format."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        else:
            patient_id = request.user.id  # patients can only generate for themselves

        profile = get_health_profile(patient_id)
        if not profile:
            return Response(
                {"detail": "Health profile not found. Complete onboarding first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vitals = get_vitals_history(patient_id, limit=10)
        risk_doc = get_latest_risk_scores(patient_id)
        risk_scores = risk_doc.get('scores', {}) if risk_doc else {}
        risk_data = {'conditions': risk_scores, 'cascade_effects': []}

        # Look up the patient user for the report
        from django.contrib.auth import get_user_model
        PatientUser = get_user_model()
        try:
            patient_user = PatientUser.objects.get(id=patient_id)
        except PatientUser.DoesNotExist:
            return Response(
                {"detail": "Patient account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        doctor_user = request.user if request.user.is_doctor else None

        filename = generate_health_report(
            patient_user=patient_user,
            profile=profile,
            vitals_list=vitals,
            risk_scores=risk_data,
            doctor_user=doctor_user,
        )

        # Save metadata with both FKs
        report = mongo_models.save_report(
            patient_id=patient_id,
            filename=filename,
            report_type=report_type,
            doctor_id=doctor_id,
            notes=notes,
        )

        download_url = f"/api/reports/download/{filename}/"
        return Response({
            "message": "Report generated.",
            "report": report,
            "download_url": download_url,
        }, status=status.HTTP_201_CREATED)


class ListReportsView(APIView):
    """GET — list reports. Patients see their own; doctors see assigned reports."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.is_doctor:
            reports = mongo_models.get_reports_by_doctor(request.user.id)
        else:
            reports = mongo_models.get_reports_by_patient(request.user.id)
        return Response(reports)


class DownloadReportView(APIView):
    """GET — download a specific report PDF by filename."""
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (QueryParamJWTAuthentication,)

    def get(self, request, filename):
        # Prevent directory traversal attacks
        if not FILENAME_SAFE_RE.match(filename):
            return Response(
                {"detail": "Invalid report filename format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reports_dir = Path(settings.REPORTS_DIR).resolve()
        filepath = (reports_dir / filename).resolve()

        # Ensure the resolved file path is inside REPORTS_DIR
        try:
            filepath.relative_to(reports_dir)
        except ValueError:
            return Response(
                {"detail": "Access denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not filepath.exists() or not filepath.is_file():
            return Response(
                {"detail": "Report file not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        force_download = request.query_params.get('download', '').lower() in ('1', 'true', 'yes')

        return FileResponse(
            open(filepath, 'rb'),
            content_type='application/pdf',
            as_attachment=force_download,
            filename=filename,
        )

