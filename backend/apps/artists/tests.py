from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User


class ArtistProfilePersistenceTests(TestCase):
    def setUp(self):
        self.artist = User.objects.create_user(
            email="artist@example.com", password="test-password", role="ARTIST"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.artist)

    def test_missing_profile_is_404_then_created_profile_is_readable(self):
        self.assertEqual(self.client.get("/api/artists/me/").status_code, 404)

        created = self.client.post(
            "/api/artists/profile/",
            {"stage_name": "Test Artist", "genres": ["Pop"]},
            format="json",
        )
        self.assertEqual(created.status_code, 201)

        retrieved = self.client.get("/api/artists/me/")
        self.assertEqual(retrieved.status_code, 200)
        self.assertEqual(retrieved.data["stage_name"], "Test Artist")
