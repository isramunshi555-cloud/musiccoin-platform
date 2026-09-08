from django.utils import timezone
from rest_framework import serializers

from .models import Event, EventArtistSchedule, TicketTier, Venue


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = ["id", "name", "address", "city", "country", "capacity"]

    def validate_capacity(self, value):
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1.")
        return value


class TicketTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketTier
        fields = [
            "id",
            "tier_name",
            "description",
            "price_fiat",
            "price_crypto",
            "max_supply",
            "minted_count",
            "max_resale_price",
            "on_chain_tier_id",
            "is_active",
        ]
        read_only_fields = ["id", "minted_count", "on_chain_tier_id"]

    def validate_max_supply(self, value):
        if value < 1:
            raise serializers.ValidationError("Maximum supply must be at least 1.")
        return value

    def validate_price_fiat(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_price_crypto(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_max_resale_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Resale price cannot be negative.")
        return value


class EventArtistScheduleSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(
        source="artist.stage_name",
        read_only=True,
    )
    artist_image = serializers.URLField(
        source="artist.profile_image_url",
        read_only=True,
    )

    class Meta:
        model = EventArtistSchedule
        fields = [
            "id",
            "artist",
            "artist_name",
            "artist_image",
            "stage_name",
            "start_time",
            "end_time",
        ]

    def validate(self, attrs):
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."}
            )
        return attrs


class EventListSerializer(serializers.ModelSerializer):
    organizer_email = serializers.EmailField(
        source="organizer.email",
        read_only=True,
    )
    min_price_fiat = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "banner_image_url",
            "city",
            "country",
            "start_date",
            "end_date",
            "status",
            "organizer_email",
            "is_featured",
            "min_price_fiat",
        ]

    def get_min_price_fiat(self, obj):
        tier = obj.tiers.filter(is_active=True).order_by("price_fiat").first()
        return str(tier.price_fiat) if tier else "0.00"


class EventDetailSerializer(serializers.ModelSerializer):
    venue = VenueSerializer(read_only=True)
    tiers = TicketTierSerializer(many=True, read_only=True)
    lineup = EventArtistScheduleSerializer(many=True, read_only=True)
    organizer_email = serializers.EmailField(
        source="organizer.email",
        read_only=True,
    )

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "banner_image_url",
            "venue",
            "city",
            "country",
            "start_date",
            "end_date",
            "status",
            "on_chain_event_id",
            "contract_address",
            "is_featured",
            "organizer_email",
            "tiers",
            "lineup",
            "created_at",
        ]


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "banner_image_url",
            "venue",
            "city",
            "country",
            "start_date",
            "end_date",
            "status",
            "is_featured",
        ]
        read_only_fields = ["id", "status", "is_featured"]

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        start_date = attrs.get(
            "start_date",
            instance.start_date if instance else None,
        )
        end_date = attrs.get(
            "end_date",
            instance.end_date if instance else None,
        )

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError(
                {"end_date": "End date must be after start date."}
            )

        if not instance and start_date and start_date <= timezone.now():
            raise serializers.ValidationError(
                {"start_date": "A new event must start in the future."}
            )

        return attrs

    def create(self, validated_data):
        validated_data["organizer"] = self.context["request"].user
        return super().create(validated_data)