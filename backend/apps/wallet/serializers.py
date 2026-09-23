from rest_framework import serializers

from .models import (
    StakingRecord,
    WalletTransaction,
)


class WalletTransactionSerializer(
    serializers.ModelSerializer
):
    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    class Meta:
        model = WalletTransaction

        fields = [
            "id",
            "user_email",
            "tx_hash",
            "tx_type",
            "amount",
            "currency",
            "status",
            "from_address",
            "to_address",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user_email",
            "created_at",
        ]


class StakingRecordSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = StakingRecord

        fields = [
            "id",
            "position_id",
            "amount",
            "lock_duration_days",
            "reward_rate_bps",
            "start_time",
            "end_time",
            "is_active",
            "claimed_reward",
        ]

        read_only_fields = [
            "id",
        ]