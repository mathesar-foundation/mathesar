from rest_framework import viewsets

from mathesar.api.serializers.users import UserSerializer, DatabaseRoleSerializer, SchemaRoleSerializer
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.models.users import User, DatabaseRole, SchemaRole


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    pagination_class = DefaultLimitOffsetPagination


class DatabaseRoleViewSet(viewsets.ModelViewSet):
    queryset = DatabaseRole.objects.all().order_by('id')
    serializer_class = DatabaseRoleSerializer
    pagination_class = DefaultLimitOffsetPagination


class SchemaRoleViewSet(viewsets.ModelViewSet):
    queryset = SchemaRole.objects.all().order_by('id')
    serializer_class = SchemaRoleSerializer
    pagination_class = DefaultLimitOffsetPagination
