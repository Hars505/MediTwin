"""
Chatbot URL configuration.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('session/', views.StartSessionView.as_view(), name='chatbot-start-session'),
    path('message/', views.SendMessageView.as_view(), name='chatbot-send-message'),
    path('history/', views.SessionHistoryView.as_view(), name='chatbot-history'),
    path('symptoms/', views.SymptomMemoryView.as_view(), name='chatbot-symptoms'),
    path('dataset-stats/', views.DatasetStatsView.as_view(), name='chatbot-dataset-stats'),
]
