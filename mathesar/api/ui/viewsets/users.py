from rest_framework import viewsets

from mathesar.api.serializers.users import UserSerializer
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.models.users import User


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    pagination_class = DefaultLimitOffsetPagination
