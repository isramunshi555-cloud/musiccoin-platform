from rest_framework.generics import RetrieveUpdateAPIView

from .serializers import UserProfileSerializer


class CurrentUserView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user