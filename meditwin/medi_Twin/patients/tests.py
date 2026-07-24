"""
Unit and integration tests for Patients app (Health Profile, Vitals, Lifestyle Logs).
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class PatientsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            username='patientone',
            email='patientone@example.com',
            password='Password123!',
            role='patient',
        )
        self.client.force_authenticate(user=self.patient)

        self.profile_url = '/api/patient/profile/'
        self.vitals_url = '/api/patient/vitals/'
        self.latest_vitals_url = '/api/patient/vitals/latest/'
        self.lifestyle_url = '/api/patient/lifestyle/'

    def test_unauthenticated_access_denied(self):
        """Verify unauthenticated requests return 401 Unauthorized."""
        unauth_client = APIClient()
        response = unauth_client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_health_profile_creation(self):
        """Test posting health profile data updates onboarding status."""
        payload = {
            'height_cm': 175.0,
            'weight_kg': 70.0,
            'blood_type': 'O+',
            'smoking_status': 'never',
            'alcohol_consumption': 'occasional',
            'exercise_frequency': 'moderate',
            'medical_history': ['hypertension'],
        }
        response = self.client.post(self.profile_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile', response.data)

        # Confirm user onboarding status set to True
        self.patient.refresh_from_db()
        self.assertTrue(self.patient.onboarding_complete)

    def test_vitals_recording(self):
        """Test recording new patient vitals."""
        payload = {
            'systolic_bp': 120,
            'diastolic_bp': 80,
            'heart_rate': 72,
            'blood_glucose': 95.0,
            'oxygen_saturation': 98.0,
            'body_temperature': 36.6,
        }
        response = self.client.post(self.vitals_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('vitals', response.data)

    def test_lifestyle_logging(self):
        """Test adding daily lifestyle log entry."""
        payload = {
            'sleep_hours': 8.0,
            'water_intake_liters': 2.5,
            'steps_count': 8500,
            'stress_level': 3,
            'diet_quality': 'good',
        }
        response = self.client.post(self.lifestyle_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('log', response.data)
