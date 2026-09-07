from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        FAN = "FAN", "Fan"
        ARTIST = "ARTIST", "Artist"
        ORGANIZER = "ORGANIZER", "Organizer"
        PRODUCTION_HOUSE = "PRODUCTION_HOUSE", "Production House"
        ADMIN = "ADMIN", "Admin"

    username = None
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.FAN,
    )
    wallet_address = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
    )
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email