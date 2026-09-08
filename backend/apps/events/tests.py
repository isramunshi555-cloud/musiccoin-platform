from django.test import TestCase
from django.utils import timezone
from apps.users.models import User
from apps.events.models import Event, Venue, TicketTier


class EventModelTests(TestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            email="organizer@festival.com",
            password="securePassword123!",
            role=User.Role.ORGANIZER,
        )
        self.venue = Venue.objects.create(
            name="Main Arena",
            city="Amsterdam",
            country="Netherlands",
            capacity=15000,
        )

    def test_create_event_and_tiers(self):
        event = Event.objects.create(
            organizer=self.organizer,
            title="Sonic Boom 2026",
            description="Electronic fest",
            venue=self.venue,
            city="Amsterdam",
            country="Netherlands",
            start_date=timezone.now() + timezone.timedelta(days=30),
            end_date=timezone.now() + timezone.timedelta(days=33),
            status=Event.EventStatus.PUBLISHED,
        )
        self.assertEqual(event.slug, "sonic-boom-2026")

        tier = TicketTier.objects.create(
            event=event,
            tier_name="VIP Pass",
            price_fiat=120.00,
            price_crypto=0.10,
            max_supply=500,
        )
        self.assertEqual(tier.tier_name, "VIP Pass")
        self.assertEqual(event.tiers.count(), 1)
