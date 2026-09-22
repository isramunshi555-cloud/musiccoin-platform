from rest_framework import serializers
from .models import RoyaltySplitConfig, RoyaltyRecipient, RoyaltyPayout


class RoyaltyRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoyaltyRecipient
        fields = ["id", "wallet_address", "role_name", "share_percentage"]


class RoyaltyPayoutSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="recipient.role_name", read_only=True)
    wallet_address = serializers.CharField(source="recipient.wallet_address", read_only=True)

    class Meta:
        model = RoyaltyPayout
        fields = ["id", "role_name", "wallet_address", "amount", "currency", "tx_hash", "created_at"]


class RoyaltySplitConfigSerializer(serializers.ModelSerializer):
    recipients = RoyaltyRecipientSerializer(many=True, read_only=True)
    payouts = RoyaltyPayoutSerializer(many=True, read_only=True)

    class Meta:
        model = RoyaltySplitConfig
        fields = [
            "id",
            "split_id",
            "title",
            "contract_address",
            "total_shares",
            "recipients",
            "payouts",
            "created_at",
        ]


class CreateRoyaltySplitSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    split_id = serializers.CharField(max_length=66)
    contract_address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    recipients = RoyaltyRecipientSerializer(many=True)

    def create(self, validated_data):
        recipients_data = validated_data.pop("recipients")
        user = self.context["request"].user
        split = RoyaltySplitConfig.objects.create(created_by=user, **validated_data)

        for r_data in recipients_data:
            RoyaltyRecipient.objects.create(split=split, **r_data)

        return split
