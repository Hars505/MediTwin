"""
Reports URL configuration.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.GenerateReportView.as_view(), name='report-generate'),
    path('', views.ListReportsView.as_view(), name='report-list'),
    path('download/<str:filename>/', views.DownloadReportView.as_view(), name='report-download'),
]
