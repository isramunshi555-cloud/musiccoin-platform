from django.test import TestCase
from django.utils import timezone
from apps.users.models import User
from apps.events.models import Event, TicketTier
from apps.tickets.models import Ticket, CheckInLog


class TicketModelTests(TestCase):
    def setUp(self):
        self.fan = User.objects.create_user(
            email="fan@musiccoin.io",
            password="securePassword123!",
            role=User.Role.FAN,
        )
        self.organizer = User.objects.create_user(
            email="org@musiccoin.io",
            password="securePassword123!",
            role=User.Role.ORGANIZER,
        )
        self.event = Event.objects.create(
            organizer=self.organizer,
            title="Bass Camp 2026",
            city="Miami",
            country="USA",
            start_date=timezone.now() + timezone.timedelta(days=10),
            end_date=timezone.now() + timezone.timedelta(days=12),
            status=Event.EventStatus.PUBLISHED,
        )
        self.tier = TicketTier.objects.create(
            event=self.event,
            tier_name="General Admission",
            price_fiat=65.00,
            max_supply=1000,
        )

    def test_ticket_issuance_and_hmac_verification(self):
        ticket = Ticket.objects.create(
            user=self.fan,
            event=self.event,
            tier=self.tier,
            nft_token_id=77,
            purchase_price=65.00,
        )
        hmac_hash = ticket.generate_verification_hash()
        self.assertIsNotNone(hmac_hash)
        self.assertEqual(len(hmac_hash), 64) # sha256 hex length
        self.assertEqual(ticket.status, Ticket.TicketStatus.ISSUED)
