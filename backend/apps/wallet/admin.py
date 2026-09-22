from django.contrib import admin
from .models import WalletTransaction, StakingRecord


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ["user", "tx_type", "amount", "currency", "status", "tx_hash", "created_at"]
    list_filter = ["tx_type", "status", "currency"]
    search_fields = ["user__email", "tx_hash", "from_address", "to_address"]


@admin.register(StakingRecord)
class StakingRecordAdmin(admin.ModelAdmin):
    list_display = ["user", "position_id", "amount", "lock_duration_days", "reward_rate_bps", "is_active", "start_time"]
    list_filter = ["is_active", "lock_duration_days"]
    search_fields = ["user__email"]
