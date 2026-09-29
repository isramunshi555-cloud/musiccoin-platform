from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.users.models import User


class PasswordRecoveryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="fan@example.com", password="original-password"
        )

    @override_settings(
        DEBUG=False,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        PASSWORD_RESET_BASE_URL="https://musiccoin.example",
    )
    def test_reset_email_uses_public_frontend(self):
        response = self.client.post(
            "/api/auth/forgot-password/", {"email": self.user.email}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("https://musiccoin.example/reset-password?", mail.outbox[0].body)
        self.assertNotIn("localhost", mail.outbox[0].body)

    @override_settings(
        DEBUG=False,
        EMAIL_BACKEND="django.core.mail.backends.console.EmailBackend",
        PASSWORD_RESET_BASE_URL="https://musiccoin.example",
    )
    def test_production_does_not_claim_to_send_console_email(self):
        response = self.client.post(
            "/api/auth/forgot-password/", {"email": self.user.email}
        )
        self.assertEqual(response.status_code, 503)
