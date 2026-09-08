import uuid
import hmac
import hashlib
from django.conf import settings
from django.db import models


class Ticket(models.Model):
    class TicketStatus(models.TextChoices):
        ISSUED = "ISSUED", "Issued"
        CHECKED_IN = "CHECKED_IN", "Checked In"
        TRANSFERRED = "TRANSFERRED", "Transferred"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="purchased_tickets",
    )
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="tickets",
    )
    tier = models.ForeignKey(
        "events.TicketTier",
        on_delete=models.CASCADE,
        related_name="issued_tickets",
    )
    
    nft_token_id = models.PositiveIntegerField(null=True, blank=True)
    contract_address = models.CharField(max_length=255, blank=True)
    tx_hash = models.CharField(max_length=255, blank=True)
    
    status = models.CharField(
        max_length=30,
        choices=TicketStatus.choices,
        default=TicketStatus.ISSUED,
    )
    
    qr_code_secret = models.CharField(max_length=64, default=uuid.uuid4)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def generate_verification_hash(self) -> str:
        """Generates dynamic HMAC hash for gate validation"""
        message = f"{self.id}:{self.event_id}:{self.user_id}:{self.qr_code_secret}"
        return hmac.new(
            settings.SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

    def __str__(self):
        return f"Ticket #{self.nft_token_id or self.id} - {self.event.title} ({self.user.email})"


class CheckInLog(models.Model):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="check_in_logs",
    )
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="gate_scans",
    )
    scanned_at = models.DateTimeField(auto_now_add=True)
    is_valid = models.BooleanField(default=True)
    notes = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Scan for {self.ticket.id} by {self.scanned_by} - {self.is_valid}"
