from django.conf import settings
from django.db import models


class WalletTransaction(models.Model):
    class TransactionType(models.TextChoices):
        TICKET_PURCHASE = "TICKET_PURCHASE", "Ticket Purchase"
        NFT_PURCHASE = "NFT_PURCHASE", "NFT Purchase"
        STAKE = "STAKE", "Stake"
        UNSTAKE = "UNSTAKE", "Unstake"
        REWARD_CLAIM = "REWARD_CLAIM", "Reward Claim"
        ROYALTY_PAYOUT = "ROYALTY_PAYOUT", "Royalty Payout"

    class TransactionStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet_transactions",
    )
    tx_hash = models.CharField(max_length=255, blank=True)
    tx_type = models.CharField(max_length=30, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=18, decimal_places=6)
    currency = models.CharField(max_length=10, default="MUSIC")
    status = models.CharField(
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.CONFIRMED,
    )
    from_address = models.CharField(max_length=255, blank=True)
    to_address = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.tx_type} ({self.amount} {self.currency})"


class StakingRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staking_positions",
    )
    position_id = models.PositiveIntegerField() # on-chain index
    amount = models.DecimalField(max_digits=18, decimal_places=6)
    lock_duration_days = models.PositiveIntegerField(default=30)
    reward_rate_bps = models.PositiveIntegerField(default=500) # 500 = 5%
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    claimed_reward = models.DecimalField(max_digits=18, decimal_places=6, default=0.00)

    class Meta:
        ordering = ["-start_time"]

    def __str__(self):
        return f"Stake #{self.position_id} ({self.amount} MUSIC for {self.user.email})"
