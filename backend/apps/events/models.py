from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Venue(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField(default=1000)

    def __str__(self):
        return f"{self.name} ({self.city})"


class Event(models.Model):
    class EventStatus(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
        PUBLISHED = "PUBLISHED", "Published"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organized_events",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField()
    banner_image_url = models.URLField(blank=True)
    
    venue = models.ForeignKey(
        Venue,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    status = models.CharField(
        max_length=30,
        choices=EventStatus.choices,
        default=EventStatus.DRAFT,
    )
    
    on_chain_event_id = models.PositiveIntegerField(null=True, blank=True)
    contract_address = models.CharField(max_length=255, blank=True)
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_date"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Event.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class TicketTier(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="tiers",
    )
    tier_name = models.CharField(max_length=100) # e.g. "Early Bird", "VIP"
    description = models.TextField(blank=True)
    price_fiat = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    price_crypto = models.DecimalField(max_digits=18, decimal_places=6, default=0.00) # in POL / MATIC
    max_supply = models.PositiveIntegerField(default=100)
    minted_count = models.PositiveIntegerField(default=0)
    max_resale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    on_chain_tier_id = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.event.title} - {self.tier_name}"


class EventArtistSchedule(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="lineup",
    )
    artist = models.ForeignKey(
        "artists.ArtistProfile",
        on_delete=models.CASCADE,
        related_name="scheduled_performances",
    )
    stage_name = models.CharField(max_length=100, default="Main Stage")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.artist.stage_name} @ {self.event.title}"
