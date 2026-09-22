from rest_framework import serializers
from .models import WalletTransaction, StakingRecord


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "tx_hash",
            "tx_type",
            "amount",
            "currency",
            "status",
            "from_address",
            "to_address",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class StakingRecordSerializer(serializers.ModelSerializer):
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
