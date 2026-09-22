from django.db.models import Sum, Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.artists.models import ArtistProfile
from apps.events.models import Event
from apps.tickets.models import Ticket
from apps.nft.models import NFTItem, NFTListing
from apps.wallet.models import StakingRecord


class PlatformOverviewAnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        total_users = User.objects.count()
        total_artists = ArtistProfile.objects.filter(is_verified=True).count()
        total_events = Event.objects.filter(status=Event.EventStatus.PUBLISHED).count()
        total_tickets_sold = Ticket.objects.count()
        total_ticket_revenue = Ticket.objects.aggregate(total=Sum("purchase_price"))["total"] or 0
        total_nfts = NFTItem.objects.count()
        total_staked_music = StakingRecord.objects.filter(is_active=True).aggregate(total=Sum("amount"))["total"] or 0

        return Response({
            "total_users": total_users,
            "verified_artists": total_artists,
            "published_events": total_events,
            "tickets_sold": total_tickets_sold,
            "ticket_revenue_usd": str(total_ticket_revenue),
            "nfts_minted": total_nfts,
            "total_staked_music": str(total_staked_music),
        })


class EventAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        event = get_object_or_404(Event, slug=slug)
        if request.user != event.organizer and request.user.role != "ADMIN":
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        total_tickets = event.tickets.count()
        checked_in = event.tickets.filter(status=Ticket.TicketStatus.CHECKED_IN).count()
        revenue = event.tickets.aggregate(total=Sum("purchase_price"))["total"] or 0

        tiers_breakdown = []
        for tier in event.tiers.all():
            tier_sold = tier.issued_tickets.count()
            tiers_breakdown.append({
                "tier_name": tier.tier_name,
                "sold": tier_sold,
                "max_supply": tier.max_supply,
                "occupancy_rate": f"{(tier_sold / tier.max_supply * 100):.1f}%" if tier.max_supply > 0 else "0%",
                "price": str(tier.price_fiat),
            })

        return Response({
            "event_title": event.title,
            "total_tickets_sold": total_tickets,
            "attendees_checked_in": checked_in,
            "check_in_rate": f"{(checked_in / total_tickets * 100):.1f}%" if total_tickets > 0 else "0%",
            "gross_revenue": str(revenue),
            "tiers": tiers_breakdown,
        })
