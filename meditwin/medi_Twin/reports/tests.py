"""
Unit and integration tests for Reports app (PDF Generation, Path Traversal Defense, Access Controls).
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class ReportsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            username='reportpatient',
            email='reportpatient@example.com',
            password='Password123!',
            role='patient',
        )
        self.doctor = User.objects.create_user(
            username='reportdoctor',
            email='reportdoctor@example.com',
            password='Password123!',
            role='doctor',
        )

        self.list_url = '/api/reports/'
        self.download_url_prefix = '/api/reports/download/'

    def test_download_report_path_traversal_prevention(self):
        """Verify path traversal attack vectors are rejected with HTTP 400 Bad Request."""
        self.client.force_authenticate(user=self.patient)

        # Attempt path traversal vectors
        malicious_filenames = [
            '../../../../etc/passwd',
            '..%2F..%2Fsettings.py',
            '../reports_secret.pdf',
            'invalid_extension.txt',
            'shell.php',
        ]

        for bad_filename in malicious_filenames:
            url = f"{self.download_url_prefix}{bad_filename}/"
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Filename '{bad_filename}' was not blocked properly!"
            )

    def test_list_reports_patient(self):
        """Test patient listing reports."""
        self.client.force_authenticate(user=self.patient)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))

    def test_list_reports_doctor(self):
        """Test doctor listing assigned reports."""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))
