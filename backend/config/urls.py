from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    # API Documentation
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),

    # Core Domain Apps
    path(
        "api/auth/",
        include("apps.authentication.urls"),
    ),
    path(
        "api/users/",
        include("apps.users.urls"),
    ),
    path(
        "api/artists/",
        include("apps.artists.urls"),
    ),
    path(
        "api/events/",
        include("apps.events.urls"),
    ),
    path(
        "api/tickets/",
        include("apps.tickets.urls"),
    ),
    path(
        "api/wallet/",
        include("apps.wallet.urls"),
    ),
    path(
        "api/nft/",
        include("apps.nft.urls"),
    ),
    path(
        "api/royalties/",
        include("apps.royalties.urls"),
    ),
    path(
        "api/analytics/",
        include("apps.analytics.urls"),
    ),
]