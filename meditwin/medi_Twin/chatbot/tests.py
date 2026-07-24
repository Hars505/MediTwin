"""
Unit and integration tests for Chatbot app (Session Lifecycle, Symptom Extraction, QA Queries, Input Capping).
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from chatbot.views import extract_symptoms

User = get_user_model()


class ChatbotUnitAndApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='chatuser',
            email='chatuser@example.com',
            password='Password123!',
            role='patient',
        )
        self.client.force_authenticate(user=self.user)

        self.session_url = '/api/chatbot/session/'
        self.message_url = '/api/chatbot/message/'
        self.history_url = '/api/chatbot/history/'

    def test_symptom_extraction_unit(self):
        """Test keyword-based symptom extraction logic."""
        text = "I have a severe headache, fever, and shortness of breath since yesterday."
        extracted = extract_symptoms(text)
        self.assertIn('headache', extracted)
        self.assertIn('fever', extracted)
        self.assertIn('shortness of breath', extracted)
        self.assertNotIn('nausea', extracted)

    def test_start_session_api(self):
        """Test starting or resuming a chatbot session."""
        response = self.client.post(self.session_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('session_id', response.data)

    def test_send_message_missing_fields(self):
        """Test payload validation for missing session_id or message."""
        response = self.client.post(self.message_url, {'message': 'Hello doctor'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
