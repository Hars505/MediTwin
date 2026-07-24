"""
ML Engine URL configuration.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('risk-scores/', views.RiskScoresView.as_view(), name='ml-risk-scores'),
    path('risk-scores/calculate/', views.CalculateRiskView.as_view(), name='ml-calculate-risk'),
    path('risk-scores/history/', views.RiskScoreHistoryView.as_view(), name='ml-risk-history'),
    path('what-if/', views.WhatIfView.as_view(), name='ml-what-if'),
    path('model-metrics/', views.ModelMetricsView.as_view(), name='ml-model-metrics'),
]
