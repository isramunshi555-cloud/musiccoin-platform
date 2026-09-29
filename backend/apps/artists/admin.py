from django.contrib import admin

from .models import ArtistProfile


@admin.register(ArtistProfile)
class ArtistProfileAdmin(admin.ModelAdmin):
    list_display = ("stage_name", "user", "location", "is_verified", "is_featured", "created_at")
    list_filter = ("is_verified", "is_featured")
    search_fields = ("stage_name", "user__email", "location")
    readonly_fields = ("created_at", "updated_at")
