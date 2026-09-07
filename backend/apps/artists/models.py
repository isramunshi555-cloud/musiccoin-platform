from django.conf import settings
from django.db import models


class ArtistProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="artist_profile",
    )

    stage_name = models.CharField(
        max_length=150,
        unique=True,
    )

    bio = models.TextField(blank=True)
    genres = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=150, blank=True)

    profile_image_url = models.URLField(blank=True)
    cover_image_url = models.URLField(blank=True)

    website_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    spotify_url = models.URLField(blank=True)

    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["stage_name"]

    def __str__(self):
        return self.stage_name