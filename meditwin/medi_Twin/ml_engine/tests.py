"""
Unit and integration tests for ML Engine (Predictor, SHAP, What-If simulation).
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from .predictor import (
    calculate_risk_scores,
    generate_shap_explanations,
    what_if_simulation,
)

User = get_user_model()


class MlEngineUnitTests(TestCase):
    def setUp(self):
        self.sample_profile = {
            'age': 55,
            'gender': 'male',
            'medical_history': ['hypertension'],
            'smoking_status': 'former',
        }
        self.sample_vitals = {
            'systolic_bp': 145,
            'diastolic_bp': 92,
            'heart_rate': 82,
            'blood_glucose': 135.0,
            'bmi': 29.5,
        }

    def test_calculate_risk_scores_calculation(self):
        """Test disease risk score calculation returns expected structure."""
        results = calculate_risk_scores(self.sample_profile, self.sample_vitals)
        self.assertIn('conditions', results)
        self.assertIn('cardiovascular', results['conditions'])
        self.assertIn('diabetes', results['conditions'])
        self.assertIn('hypertension', results['conditions'])
        self.assertIn('kidney_disease', results['conditions'])

        # Verify values are valid percentages
        for condition, score in results['conditions'].items():
            self.assertGreaterEqual(score, 0)
            self.assertLessEqual(score, 100)

    def test_shap_explanations_generation(self):
        """Test SHAP explanations generate feature importance factors."""
        scores = calculate_risk_scores(self.sample_profile, self.sample_vitals)
        explanations = generate_shap_explanations(
            self.sample_profile, self.sample_vitals, scores
        )
        self.assertTrue(isinstance(explanations, dict))
        self.assertIn('cardiovascular', explanations)

    def test_what_if_simulation(self):
        """Test What-If simulation recalculates risk with adjustments."""
        adjustments = {'bmi': -3.0, 'blood_glucose': -20.0, 'systolic_bp': -15}
        simulated = what_if_simulation(
            self.sample_profile, self.sample_vitals, adjustments
        )
        self.assertIn('conditions', simulated)
        self.assertLess(
            simulated['conditions']['cardiovascular'],
            calculate_risk_scores(self.sample_profile, self.sample_vitals)['conditions']['cardiovascular'],
        )


class MlEngineApiIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='mlpatient',
            email='mlpatient@example.com',
            password='Password123!',
            role='patient',
        )
        self.client.force_authenticate(user=self.user)

    def test_what_if_view_input_validation(self):
        """Test what-if API endpoint validates input payload structure."""
        url = '/api/ml/what-if/'
        # Missing health profile should return 400 Bad Request
        response = self.client.post(url, {'adjustments': {'bmi': -2}}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
