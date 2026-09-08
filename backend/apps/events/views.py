from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, Venue
from .serializers import (
    EventCreateUpdateSerializer,
    EventDetailSerializer,
    EventListSerializer,
    TicketTierSerializer,
    VenueSerializer,
)


def is_organizer_or_admin(user):
    return user.is_authenticated and user.role in ["ORGANIZER", "ADMIN"]


class EventListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EventCreateUpdateSerializer
        return EventListSerializer

    def get_queryset(self):
        queryset = (
            Event.objects.all()
            .select_related("organizer")
            .prefetch_related("tiers")
        )

        user = self.request.user
        status_filter = self.request.query_params.get("status")
        city_filter = self.request.query_params.get("city")
        featured = self.request.query_params.get("featured")

        if not user.is_authenticated:
            queryset = queryset.filter(status=Event.EventStatus.PUBLISHED)
        elif user.role == "ADMIN":
            if status_filter:
                queryset = queryset.filter(status=status_filter)
        elif user.role == "ORGANIZER":
            queryset = queryset.filter(organizer=user)
            if status_filter:
                queryset = queryset.filter(status=status_filter)
        else:
            queryset = queryset.filter(status=Event.EventStatus.PUBLISHED)

        if city_filter:
            queryset = queryset.filter(city__icontains=city_filter)

        if featured and featured.lower() in ["true", "1", "yes"]:
            queryset = queryset.filter(is_featured=True)

        return queryset

    def perform_create(self, serializer):
        if not is_organizer_or_admin(self.request.user):
            raise PermissionDenied(
                "Only organizers and administrators can create events."
            )
        serializer.save()


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = "slug"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return EventCreateUpdateSerializer
        return EventDetailSerializer

    def get_queryset(self):
        queryset = (
            Event.objects.all()
            .select_related("organizer", "venue")
            .prefetch_related("tiers", "lineup__artist")
        )

        user = self.request.user

        if not user.is_authenticated:
            return queryset.filter(status=Event.EventStatus.PUBLISHED)

        if user.role == "ADMIN":
            return queryset

        if user.role == "ORGANIZER":
            return queryset.filter(organizer=user)

        return queryset.filter(status=Event.EventStatus.PUBLISHED)

    def perform_update(self, serializer):
        event = self.get_object()

        if (
            self.request.user != event.organizer
            and self.request.user.role != "ADMIN"
        ):
            raise PermissionDenied("You cannot update this event.")

        serializer.save()

    def perform_destroy(self, instance):
        if (
            self.request.user != instance.organizer
            and self.request.user.role != "ADMIN"
        ):
            raise PermissionDenied("You cannot delete this event.")

        instance.delete()


class EventPublishView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        event = get_object_or_404(Event, slug=slug)

        if request.user != event.organizer and request.user.role != "ADMIN":
            return Response(
                {"detail": "You cannot publish this event."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.status == Event.EventStatus.CANCELLED:
            return Response(
                {"detail": "A cancelled event cannot be published."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event.status = Event.EventStatus.PUBLISHED
        event.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "detail": "Event published successfully.",
                "status": event.status,
            }
        )


class VenueListCreateView(generics.ListCreateAPIView):
    queryset = Venue.objects.all().order_by("name")
    serializer_class = VenueSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        if not is_organizer_or_admin(self.request.user):
            raise PermissionDenied(
                "Only organizers and administrators can create venues."
            )
        serializer.save()


class TicketTierCreateView(generics.CreateAPIView):
    serializer_class = TicketTierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        event = get_object_or_404(Event, slug=self.kwargs["slug"])

        if (
            self.request.user != event.organizer
            and self.request.user.role != "ADMIN"
        ):
            raise PermissionDenied(
                "You cannot create ticket tiers for this event."
            )

        serializer.save(event=event)