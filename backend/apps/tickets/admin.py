from django.contrib import admin
from .models import Ticket, CheckInLog


class CheckInLogInline(admin.TabularInline):
    model = CheckInLog
    extra = 0
    readonly_fields = ["scanned_by", "scanned_at", "is_valid", "notes"]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ["id", "event", "tier", "user", "nft_token_id", "status", "created_at", "checked_in_at"]
    list_filter = ["status", "event"]
    search_fields = ["id", "user__email", "tx_hash"]
    inlines = [CheckInLogInline]


@admin.register(CheckInLog)
class CheckInLogAdmin(admin.ModelAdmin):
    list_display = ["ticket", "scanned_by", "scanned_at", "is_valid", "notes"]
    list_filter = ["is_valid"]
