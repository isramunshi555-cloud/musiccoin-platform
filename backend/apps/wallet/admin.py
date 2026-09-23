from django.contrib import admin

from .models import (
    StakingRecord,
    WalletTransaction,
)


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "tx_type",
        "amount",
        "currency",
        "status",
        "short_from_address",
        "short_to_address",
        "created_at",
    )

    list_filter = (
        "tx_type",
        "status",
        "currency",
        "created_at",
    )

    search_fields = (
        "user__email",
        "tx_hash",
        "from_address",
        "to_address",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )

    def short_from_address(self, obj):
        if not obj.from_address:
            return "-"

        return (
            f"{obj.from_address[:8]}"
            f"..."
            f"{obj.from_address[-6:]}"
        )

    short_from_address.short_description = "From"

    def short_to_address(self, obj):
        if not obj.to_address:
            return "-"

        return (
            f"{obj.to_address[:8]}"
            f"..."
            f"{obj.to_address[-6:]}"
        )

    short_to_address.short_description = "To"


@admin.register(StakingRecord)
class StakingRecordAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "position_id",
        "amount",
        "lock_duration_days",
        "is_active",
        "start_time",
        "end_time",
    )

    list_filter = (
        "is_active",
        "lock_duration_days",
    )

    search_fields = (
        "user__email",
    )

    ordering = (
        "-start_time",
    )