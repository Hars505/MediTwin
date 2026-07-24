"""
Patients URL configuration.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.HealthProfileView.as_view(), name='patient-profile'),
    path('vitals/', views.VitalsView.as_view(), name='patient-vitals'),
    path('vitals/latest/', views.LatestVitalsView.as_view(), name='patient-vitals-latest'),
    path('lifestyle/', views.LifestyleLogView.as_view(), name='patient-lifestyle'),
    path('tour-complete/', views.TourCompleteView.as_view(), name='patient-tour-complete'),
]
