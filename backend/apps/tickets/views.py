import hmac

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import Event, TicketTier

from .models import CheckInLog, Ticket
from .serializers import (
    TicketListSerializer,
    TicketPurchaseSerializer,
    TicketVerificationSerializer,
)


class MyTicketsView(generics.ListAPIView):
    serializer_class = TicketListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Ticket.objects.filter(user=self.request.user)
            .select_related("event", "tier")
        )


class PurchaseTicketView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = TicketPurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tier = get_object_or_404(
            TicketTier.objects.select_for_update().select_related("event"),
            id=serializer.validated_data["tier_id"],
            is_active=True,
        )

        event = tier.event

        if event.status != Event.EventStatus.PUBLISHED:
            return Response(
                {"detail": "Tickets are not available for this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.now() >= event.start_date:
            return Response(
                {"detail": "Ticket sales for this event have ended."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if tier.minted_count >= tier.max_supply:
            return Response(
                {"detail": "This ticket tier is sold out."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_method = serializer.validated_data["payment_method"]
        tx_hash = serializer.validated_data.get("tx_hash", "")

        if payment_method == "CRYPTO" and not tx_hash:
            return Response(
                {"detail": "A transaction hash is required for crypto payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tier.minted_count += 1
        tier.save(update_fields=["minted_count"])

        ticket = Ticket.objects.create(
            user=request.user,
            event=event,
            tier=tier,
            nft_token_id=serializer.validated_data.get("nft_token_id"),
            tx_hash=tx_hash,
            contract_address=event.contract_address,
            purchase_price=tier.price_fiat,
            status=Ticket.TicketStatus.ISSUED,
        )

        return Response(
            TicketListSerializer(ticket).data,
            status=status.HTTP_201_CREATED,
        )


class GateCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = TicketVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket = get_object_or_404(
            Ticket.objects.select_for_update().select_related(
                "event",
                "tier",
                "user",
            ),
            id=serializer.validated_data["ticket_id"],
        )

        if (
            request.user != ticket.event.organizer
            and request.user.role != "ADMIN"
        ):
            raise PermissionDenied(
                "You are not authorized to scan tickets for this event."
            )

        provided_hash = serializer.validated_data["verification_hash"]
        valid_hash = ticket.generate_verification_hash()

        if not hmac.compare_digest(provided_hash, valid_hash):
            CheckInLog.objects.create(
                ticket=ticket,
                scanned_by=request.user,
                is_valid=False,
                notes="Invalid verification hash",
            )
            return Response(
                {
                    "detail": "Invalid or tampered ticket QR code.",
                    "valid": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ticket.status == Ticket.TicketStatus.CANCELLED:
            CheckInLog.objects.create(
                ticket=ticket,
                scanned_by=request.user,
                is_valid=False,
                notes="Cancelled ticket",
            )
            return Response(
                {"detail": "This ticket was cancelled.", "valid": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ticket.status == Ticket.TicketStatus.CHECKED_IN:
            CheckInLog.objects.create(
                ticket=ticket,
                scanned_by=request.user,
                is_valid=False,
                notes="Ticket already checked in",
            )
            return Response(
                {
                    "detail": "This ticket has already been used.",
                    "valid": False,
                    "already_used": True,
                    "checked_in_at": ticket.checked_in_at,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        if now < ticket.event.start_date:
            return Response(
                {"detail": "This event has not started yet.", "valid": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if now > ticket.event.end_date:
            CheckInLog.objects.create(
                ticket=ticket,
                scanned_by=request.user,
                is_valid=False,
                notes="Event expired",
            )
            return Response(
                {"detail": "This event has concluded.", "valid": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = Ticket.TicketStatus.CHECKED_IN
        ticket.checked_in_at = now
        ticket.save(update_fields=["status", "checked_in_at"])

        CheckInLog.objects.create(
            ticket=ticket,
            scanned_by=request.user,
            is_valid=True,
            notes="Successful admission",
        )

        return Response(
            {
                "detail": "Admission granted.",
                "valid": True,
                "attendee_email": ticket.user.email,
                "event_title": ticket.event.title,
                "tier_name": ticket.tier.tier_name,
                "nft_token_id": ticket.nft_token_id,
                "checked_in_at": ticket.checked_in_at,
            }
        )


class EventAttendeeListView(generics.ListAPIView):
    serializer_class = TicketListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        event = get_object_or_404(Event, slug=self.kwargs["slug"])

        if (
            self.request.user != event.organizer
            and self.request.user.role != "ADMIN"
        ):
            raise PermissionDenied(
                "You cannot view attendees for this event."
            )

        return (
            Ticket.objects.filter(event=event)
            .select_related("user", "event", "tier")
        )
