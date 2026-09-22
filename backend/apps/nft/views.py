from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NFTItem, NFTListing
from .serializers import NFTItemSerializer, NFTListingSerializer


class NFTItemListCreateView(generics.ListCreateAPIView):
    serializer_class = NFTItemSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = NFTItem.objects.all().select_related("creator", "current_owner").prefetch_related("listings")
        category = self.request.query_params.get("category")
        creator_id = self.request.query_params.get("creator_id")
        owner_id = self.request.query_params.get("owner_id")

        if category:
            queryset = queryset.filter(category=category)
        if creator_id:
            queryset = queryset.filter(creator_id=creator_id)
        if owner_id:
            queryset = queryset.filter(current_owner_id=owner_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user, current_owner=self.request.user)


class NFTItemDetailView(generics.RetrieveAPIView):
    queryset = NFTItem.objects.all().select_related("creator", "current_owner").prefetch_related("listings")
    serializer_class = NFTItemSerializer
    permission_classes = [permissions.AllowAny]


class MarketplaceListingListView(generics.ListCreateAPIView):
    serializer_class = NFTListingSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return NFTListing.objects.filter(is_active=True).select_related("item", "seller")

    def perform_create(self, serializer):
        item = serializer.validated_data["item"]
        if item.current_owner != self.request.user:
            raise permissions.exceptions.PermissionDenied("You can only list NFTs you own.")
        serializer.save(seller=self.request.user, is_active=True)


class BuyNFTView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        listing = get_object_or_404(NFTListing.objects.select_related("item", "seller"), pk=pk, is_active=True)

        if listing.seller == request.user:
            return Response({"detail": "You cannot buy your own listing"}, status=status.HTTP_400_BAD_REQUEST)

        tx_hash = request.data.get("tx_hash", "")

        # Transfer ownership
        item = listing.item
        item.current_owner = request.user
        item.save()

        # Mark listing as sold
        listing.is_active = False
        listing.buyer = request.user
        listing.sold_at = timezone.now()
        listing.tx_hash = tx_hash
        listing.save()

        return Response({
            "detail": f"Successfully purchased {item.title}!",
            "item_id": item.id,
            "new_owner": request.user.email,
        }, status=status.HTTP_200_OK)
