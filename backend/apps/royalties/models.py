from django.conf import settings
from django.db import models


class RoyaltySplitConfig(models.Model):
    split_id = models.CharField(max_length=66, unique=True) # bytes32 hex
    title = models.CharField(max_length=255)
    contract_address = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_splits",
    )
    total_shares = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.split_id[:10]}...)"


class RoyaltyRecipient(models.Model):
    split = models.ForeignKey(
        RoyaltySplitConfig,
        on_delete=models.CASCADE,
        related_name="recipients",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="royalty_recipient_roles",
    )
    wallet_address = models.CharField(max_length=255)
    role_name = models.CharField(max_length=100, default="Artist") # Artist, Producer, Label
    share_percentage = models.DecimalField(max_digits=5, decimal_places=2) # e.g. 60.00%

    def __str__(self):
        return f"{self.role_name} ({self.share_percentage}%) - {self.wallet_address}"


class RoyaltyPayout(models.Model):
    split = models.ForeignKey(
        RoyaltySplitConfig,
        on_delete=models.CASCADE,
        related_name="payouts",
    )
    recipient = models.ForeignKey(
        RoyaltyRecipient,
        on_delete=models.CASCADE,
        related_name="payout_history",
    )
    amount = models.DecimalField(max_digits=18, decimal_places=6)
    currency = models.CharField(max_length=10, default="POL")
    tx_hash = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payout {self.amount} {self.currency} to {self.recipient.role_name}"
