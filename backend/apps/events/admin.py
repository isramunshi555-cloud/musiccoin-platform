from django.contrib import admin
from .models import Venue, Event, TicketTier, EventArtistSchedule


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ["name", "city", "country", "capacity"]
    search_fields = ["name", "city"]


class TicketTierInline(admin.TabularInline):
    model = TicketTier
    extra = 1


class EventArtistScheduleInline(admin.TabularInline):
    model = EventArtistSchedule
    extra = 1


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "city", "start_date", "status", "organizer", "is_featured"]
    list_filter = ["status", "is_featured", "city"]
    search_fields = ["title", "description", "city"]
    inlines = [TicketTierInline, EventArtistScheduleInline]


@admin.register(TicketTier)
class TicketTierAdmin(admin.ModelAdmin):
    list_display = ["tier_name", "event", "price_fiat", "price_crypto", "minted_count", "max_supply", "is_active"]
    list_filter = ["is_active"]
