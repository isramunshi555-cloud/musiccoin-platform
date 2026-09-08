from rest_framework import serializers
from .models import Ticket, CheckInLog


class TicketListSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_start_date = serializers.DateTimeField(source="event.start_date", read_only=True)
    event_city = serializers.CharField(source="event.city", read_only=True)
    tier_name = serializers.CharField(source="tier.tier_name", read_only=True)
    verification_hash = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "event_title",
            "event_start_date",
            "event_city",
            "tier_name",
            "nft_token_id",
            "status",
            "verification_hash",
            "purchase_price",
            "created_at",
            "checked_in_at",
        ]

    def get_verification_hash(self, obj):
        return obj.generate_verification_hash()


class TicketPurchaseSerializer(serializers.Serializer):
    tier_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=["CRYPTO", "FIAT"])
    wallet_address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    tx_hash = serializers.CharField(max_length=255, required=False, allow_blank=True)
    nft_token_id = serializers.IntegerField(required=False, allow_null=True)


class TicketVerificationSerializer(serializers.Serializer):
    ticket_id = serializers.UUIDField()
    verification_hash = serializers.CharField(max_length=64)


class CheckInLogSerializer(serializers.ModelSerializer):
    scanned_by_email = serializers.EmailField(source="scanned_by.email", read_only=True)

    class Meta:
        model = CheckInLog
        fields = ["id", "ticket", "scanned_by_email", "scanned_at", "is_valid", "notes"]
