from django.contrib import admin
from .models import RoyaltySplitConfig, RoyaltyRecipient, RoyaltyPayout, OnchainNFTRoyalty


class RoyaltyRecipientInline(admin.TabularInline):
    model = RoyaltyRecipient
    extra = 1


class RoyaltyPayoutInline(admin.TabularInline):
    model = RoyaltyPayout
    extra = 0
    readonly_fields = ["recipient", "amount", "currency", "tx_hash", "created_at"]


@admin.register(RoyaltySplitConfig)
class RoyaltySplitConfigAdmin(admin.ModelAdmin):
    list_display = ["title", "split_id", "total_shares", "created_by", "created_at"]
    search_fields = ["title", "split_id"]
    inlines = [RoyaltyRecipientInline, RoyaltyPayoutInline]


@admin.register(RoyaltyPayout)
class RoyaltyPayoutAdmin(admin.ModelAdmin):
    list_display = ["split", "recipient", "amount", "currency", "tx_hash", "created_at"]


@admin.register(OnchainNFTRoyalty)
class OnchainNFTRoyaltyAdmin(admin.ModelAdmin):
    list_display = ["token_id", "receiver_wallet", "amount", "currency", "tx_hash", "created_at"]
    search_fields = ["receiver_wallet", "tx_hash", "token_id"]
