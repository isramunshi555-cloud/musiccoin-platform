from django.urls import path
from .views import PlatformOverviewAnalyticsView, EventAnalyticsView

urlpatterns = [
    path("overview/", PlatformOverviewAnalyticsView.as_view(), name="platform-overview"),
    path("event/<slug:slug>/", EventAnalyticsView.as_view(), name="event-analytics"),
]
