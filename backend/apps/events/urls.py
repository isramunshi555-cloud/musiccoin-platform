from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    EventPublishView,
    VenueListCreateView,
    TicketTierCreateView,
)

urlpatterns = [
    path("", EventListCreateView.as_view(), name="event-list-create"),
    path("venues/", VenueListCreateView.as_view(), name="venue-list-create"),
    path("<slug:slug>/", EventDetailView.as_view(), name="event-detail"),
    path("<slug:slug>/publish/", EventPublishView.as_view(), name="event-publish"),
    path("<slug:slug>/tiers/", TicketTierCreateView.as_view(), name="ticket-tier-create"),
]
