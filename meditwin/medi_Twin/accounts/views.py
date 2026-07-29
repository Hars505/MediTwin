"""
Auth, profile, doctor, and notification views.

Endpoints:
  POST /api/auth/register/            — register new user
  GET/PUT /api/auth/profile/          — user profile
  POST /api/auth/change-password/     — change password
  GET/PUT /api/auth/doctor-profile/   — doctor-specific profile
  GET /api/auth/doctors/              — list all doctors
  GET /api/auth/notifications/        — list notifications
  POST /api/auth/notifications/read/  — mark notification(s) as read

JWT token obtain/refresh is handled by simplejwt views in urls.py.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    DoctorProfileSerializer,
)
from . import mongo_models
# pyrefly: ignore [missing-import]
from patients import mongo_models as patient_models
# pyrefly: ignore [missing-import]
from ml_engine import mongo_models as ml_models
# pyrefly: ignore [missing-import]
from ml_engine import clinical_rules

User = get_user_model()


def _get_client_ip(request):
    """Extract client IP from the request."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _safe_int_limit(request, param='limit', default=50, max_val=100):
    """Safely parse integer query parameter within [1, max_val]."""
    try:
        val = int(request.query_params.get(param, default))
        return max(1, min(val, max_val))
    except (ValueError, TypeError):
        return default


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Rate-limited JWT token login endpoint."""
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'auth'


class ThrottledTokenRefreshView(TokenRefreshView):
    """Rate-limited JWT token refresh endpoint."""
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'auth'


class RegisterView(APIView):
    """
    POST /api/auth/register/
    JSON-based registration. Accepts fields from RegisterSerializer,
    creates the user, and returns user data + JWT tokens.
    """
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'auth'


    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens for immediate login after registration
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        # If registering as a doctor, create an empty doctor profile
        if user.role == 'doctor':
            mongo_models.create_doctor_profile(user.id, request.data)

        # Audit log
        mongo_models.log_audit_event(
            user_id=user.id,
            action='register',
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={'role': user.role},
        )

        return Response({
            "message": "User registered successfully.",
            "user": UserProfileSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  — retrieve the current user's profile.
    PUT  — update profile fields (except username, role).
    """
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()
        mongo_models.log_audit_event(
            user_id=self.request.user.id,
            action='profile_updated',
            ip_address=_get_client_ip(self.request),
        )


class ChangePasswordView(APIView):
    """POST — change the authenticated user's password."""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        mongo_models.log_audit_event(
            user_id=request.user.id,
            action='password_changed',
            ip_address=_get_client_ip(request),
        )

        return Response(
            {"message": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )


# ══════════════════════════════════════════════════════════════════════
# Doctor Profile Views
# ══════════════════════════════════════════════════════════════════════

class DoctorProfileView(APIView):
    """
    GET  — retrieve the authenticated doctor's profile.
    PUT  — update doctor profile fields.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if not request.user.is_doctor:
            return Response(
                {"detail": "Only doctors can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile = mongo_models.get_doctor_profile(request.user.id)
        if not profile:
            # Auto-create profile if missing
            profile = mongo_models.create_doctor_profile(request.user.id, {})
        return Response(profile)

    def put(self, request):
        if not request.user.is_doctor:
            return Response(
                {"detail": "Only doctors can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = DoctorProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        existing = mongo_models.get_doctor_profile(request.user.id)
        if existing:
            profile = mongo_models.update_doctor_profile(
                request.user.id, serializer.validated_data
            )
        else:
            profile = mongo_models.create_doctor_profile(
                request.user.id, serializer.validated_data
            )

        return Response({
            "message": "Doctor profile updated.",
            "profile": profile,
        })


class DoctorListView(APIView):
    """
    GET /api/auth/doctors/
    List all doctors with their profiles. Available to all authenticated users.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        doctor_profiles = mongo_models.get_all_doctors()

        # Enrich with user info from Django
        doctor_users = User.objects.filter(role='doctor').values(
            'id', 'username', 'first_name', 'last_name', 'email'
        )
        user_map = {u['id']: u for u in doctor_users}

        result = []
        for dp in doctor_profiles:
            user_info = user_map.get(dp['user_id'], {})
            result.append({
                **dp,
                'username': user_info.get('username', ''),
                'first_name': user_info.get('first_name', ''),
                'last_name': user_info.get('last_name', ''),
                'email': user_info.get('email', ''),
            })

        return Response(result)


class DoctorPatientsView(APIView):
    """
    GET /api/auth/doctor-patients/
    Retrieve detailed clinical data for all patients with completed health profiles.
    Returns: demographics, latest vitals, latest risk scores, and CDS alerts.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if not request.user.is_doctor:
            return Response(
                {"detail": "Only doctors can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )
            
        # Get all users with patient role who have completed onboarding
        all_patients = User.objects.filter(
            role='patient',
            onboarding_complete=True,
        ).values('id', 'first_name', 'last_name', 'username')
        
        patients_data = []
        for p in all_patients:
            pid = p['id']
            profile = patient_models.get_health_profile(pid) or {}
            vitals = patient_models.get_latest_vitals(pid)
            risks = ml_models.get_latest_risk_scores(pid)
            cds_alerts = clinical_rules.evaluate_patient_data(profile, vitals, risks)
            
            patients_data.append({
                "patient_id": pid,
                "first_name": p["first_name"],
                "last_name": p["last_name"],
                "username": p["username"],
                "profile": profile,
                "latest_vitals": vitals,
                "latest_risks": risks,
                "cds_alerts": cds_alerts,
            })
            
        return Response(patients_data)

# ══════════════════════════════════════════════════════════════════════
# Notification Views
# ══════════════════════════════════════════════════════════════════════

class NotificationsView(APIView):
    """
    GET  — list notifications for the authenticated user.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        limit = _safe_int_limit(request, 'limit', default=50, max_val=100)
        unread_only = request.query_params.get('unread', '').lower() == 'true'
        notifs = mongo_models.get_notifications(
            request.user.id, limit=limit, unread_only=unread_only
        )
        unread_count = mongo_models.get_unread_count(request.user.id)
        return Response({
            "notifications": notifs,
            "unread_count": unread_count,
        })


class MarkNotificationReadView(APIView):
    """
    POST — mark notification(s) as read.
    Body: { "notification_id": "abc123" }  — mark one
    Body: { "all": true }                  — mark all as read
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if request.data.get('all'):
            mongo_models.mark_all_notifications_read(request.user.id)
            return Response({"message": "All notifications marked as read."})

        notif_id = request.data.get('notification_id')
        if not notif_id:
            return Response(
                {"detail": "Provide notification_id or {\"all\": true}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        mongo_models.mark_notification_read(notif_id)
        return Response({"message": "Notification marked as read."})
