from rest_framework import serializers

from .models import ArtistProfile


class ArtistProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = ArtistProfile
        fields = [
            "id",
            "email",
            "full_name",
            "stage_name",
            "bio",
            "genres",
            "location",
            "profile_image_url",
            "cover_image_url",
            "website_url",
            "instagram_url",
            "youtube_url",
            "spotify_url",
            "is_verified",
            "is_featured",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "email",
            "full_name",
            "is_verified",
            "is_featured",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def validate_genres(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "Genres must be provided as a list."
            )

        if not all(
            isinstance(genre, str) and genre.strip()
            for genre in value
        ):
            raise serializers.ValidationError(
                "Every genre must be a non-empty text value."
            )

        return [genre.strip() for genre in value]