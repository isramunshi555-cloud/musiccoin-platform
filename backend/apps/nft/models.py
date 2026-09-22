from django.conf import settings
from django.db import models


class NFTItem(models.Model):
    class NFTCategory(models.TextChoices):
        SONG = "SONG", "Song"
        ALBUM = "ALBUM", "Album"
        VIP_PASS = "VIP_PASS", "VIP Pass"
        COLLECTIBLE = "COLLECTIBLE", "Collectible"

    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_nfts",
    )
    current_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_nfts",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=30,
        choices=NFTCategory.choices,
        default=NFTCategory.SONG,
    )
    
    token_id = models.PositiveIntegerField(null=True, blank=True)
    contract_address = models.CharField(max_length=255, blank=True)
    metadata_uri = models.CharField(max_length=500)
    image_url = models.URLField(blank=True)
    audio_url = models.URLField(blank=True)
    
    royalty_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    royalty_receiver = models.CharField(max_length=255, blank=True)
    
    tx_hash = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} (#{self.token_id or 'draft'})"


class NFTListing(models.Model):
    class ListingType(models.TextChoices):
        FIXED_PRICE = "FIXED_PRICE", "Fixed Price"
        AUCTION = "AUCTION", "Auction"

    class Currency(models.TextChoices):
        MUSIC = "MUSIC", "MusicCoin"
        POL = "POL", "Polygon"
        USDC = "USDC", "USDC"

    item = models.ForeignKey(
        NFTItem,
        on_delete=models.CASCADE,
        related_name="listings",
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="nft_sales",
    )
    listing_type = models.CharField(
        max_length=20,
        choices=ListingType.choices,
        default=ListingType.FIXED_PRICE,
    )
    price = models.DecimalField(max_digits=18, decimal_places=6)
    currency = models.CharField(
        max_length=10,
        choices=Currency.choices,
        default=Currency.MUSIC,
    )
    is_active = models.BooleanField(default=True)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchased_listings",
    )
    tx_hash = models.CharField(max_length=255, blank=True)
    sold_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Listing for {self.item.title} ({self.price} {self.currency})"
