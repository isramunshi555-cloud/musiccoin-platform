from django.contrib import admin
from .models import NFTItem, NFTListing


class NFTListingInline(admin.TabularInline):
    model = NFTListing
    extra = 0


@admin.register(NFTItem)
class NFTItemAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "token_id", "creator", "current_owner", "royalty_percentage", "created_at"]
    list_filter = ["category"]
    search_fields = ["title", "creator__email", "current_owner__email", "contract_address"]
    inlines = [NFTListingInline]


@admin.register(NFTListing)
class NFTListingAdmin(admin.ModelAdmin):
    list_display = ["item", "seller", "price", "currency", "listing_type", "is_active", "buyer", "sold_at"]
    list_filter = ["listing_type", "is_active", "currency"]
