"""
Accounts URL configuration.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Registration
    path('register/', views.RegisterView.as_view(), name='auth-register'),

    # JWT token endpoints (rate limited)
    path('login/', views.ThrottledTokenObtainPairView.as_view(), name='auth-login'),
    path('token/refresh/', views.ThrottledTokenRefreshView.as_view(), name='auth-token-refresh'),

    # Profile management
    path('profile/', views.ProfileView.as_view(), name='auth-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),

    # Doctor profile
    path('doctor-profile/', views.DoctorProfileView.as_view(), name='auth-doctor-profile'),
    path('doctors/', views.DoctorListView.as_view(), name='auth-doctor-list'),
    path('doctor-patients/', views.DoctorPatientsView.as_view(), name='auth-doctor-patients'),

    # Notifications
    path('notifications/', views.NotificationsView.as_view(), name='auth-notifications'),
    path('notifications/read/', views.MarkNotificationReadView.as_view(), name='auth-notifications-read'),
]
