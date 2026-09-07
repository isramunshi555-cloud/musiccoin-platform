from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    RetrieveAPIView,
    RetrieveUpdateAPIView,
)
from rest_framework.permissions import AllowAny

from .models import ArtistProfile
from .permissions import IsArtist
from .serializers import ArtistProfileSerializer


class ArtistListView(ListAPIView):
    queryset = ArtistProfile.objects.select_related("user").all()
    serializer_class = ArtistProfileSerializer
    permission_classes = [AllowAny]


class ArtistDetailView(RetrieveAPIView):
    queryset = ArtistProfile.objects.select_related("user").all()
    serializer_class = ArtistProfileSerializer
    permission_classes_classes = [AllowAny]


class ArtistProfileCreateView(CreateAPIView):
    serializer_class = ArtistProfileSerializer
    permission_classes = [IsArtist]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MyArtistProfileView(RetrieveUpdateAPIView):
    serializer_class = ArtistProfileSerializer
    permission_classes = [IsArtist]

    def get_object(self):
        return ArtistProfile.objects.select_related("user").get(
            user=self.request.user
        )