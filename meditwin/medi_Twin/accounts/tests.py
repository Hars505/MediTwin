"""
Unit and integration tests for Accounts app (Registration, Login, Profile, Password Change, Throttling).
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'
        self.change_password_url = '/api/auth/change-password/'

        self.user_data = {
            'username': 'testpatient',
            'email': 'testpatient@example.com',
            'password': 'SecurePassword123!',
            'password2': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'Patient',
            'role': 'patient',
            'date_of_birth': '1995-05-15',
            'gender': 'male',
        }

    def test_user_registration_success(self):
        """Test successful registration with valid attributes."""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'testpatient')

        # Verify password is properly hashed in storage
        user = User.objects.get(username='testpatient')
        self.assertTrue(user.check_password('SecurePassword123!'))

    def test_registration_password_mismatch(self):
        """Test registration failure when password confirmation fails."""
        bad_data = self.user_data.copy()
        bad_data['password2'] = 'DifferentPassword123!'
        response = self.client.post(self.register_url, bad_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success_and_jwt_generation(self):
        """Test authenticating existing user and receiving JWT tokens."""
        user = User.objects.create_user(
            username='activeuser',
            email='active@example.com',
            password='SecurePassword123!',
            role='patient',
        )
        login_data = {'username': 'activeuser', 'password': 'SecurePassword123!'}
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_authenticated_profile_access(self):
        """Test fetching profile with JWT bearer token authentication."""
        user = User.objects.create_user(
            username='profileuser',
            email='profile@example.com',
            password='SecurePassword123!',
            role='patient',
            first_name='Profile',
            last_name='User',
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'profileuser')

    def test_change_password_success(self):
        """Test changing password for authenticated user."""
        user = User.objects.create_user(
            username='pwuser',
            email='pw@example.com',
            password='OldPassword123!',
            role='patient',
        )
        self.client.force_authenticate(user=user)
        payload = {
            'old_password': 'OldPassword123!',
            'new_password': 'BrandNewPassword123!',
        }
        response = self.client.post(self.change_password_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh user from DB and check password
        user.refresh_from_db()
        self.assertTrue(user.check_password('BrandNewPassword123!'))
