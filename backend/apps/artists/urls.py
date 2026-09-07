from django.urls import path

from .views import (
    ArtistDetailView,
    ArtistListView,
    ArtistProfileCreateView,
    MyArtistProfileView,
)

urlpatterns = [
    path("", ArtistListView.as_view(), name="artist-list"),
    path(
        "profile/",
        ArtistProfileCreateView.as_view(),
        name="artist-profile-create",
    ),
    path(
        "me/",
        MyArtistProfileView.as_view(),
        name="my-artist-profile",
    ),
    path(
        "<int:pk>/",
        ArtistDetailView.as_view(),
        name="artist-detail",
    ),
]