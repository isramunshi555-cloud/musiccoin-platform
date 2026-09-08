from django.urls import path
from .views import (
    MyTicketsView,
    PurchaseTicketView,
    GateCheckInView,
    EventAttendeeListView,
)

urlpatterns = [
    path("my-tickets/", MyTicketsView.as_view(), name="my-tickets"),
    path("purchase/", PurchaseTicketView.as_view(), name="ticket-purchase"),
    path("check-in/", GateCheckInView.as_view(), name="ticket-check-in"),
    path("event/<slug:slug>/attendees/", EventAttendeeListView.as_view(), name="event-attendees"),
]
