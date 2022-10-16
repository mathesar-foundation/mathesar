from rest_access_policy import AccessViewSetMixin
from rest_framework import viewsets
from rest_framework.exceptions import MethodNotAllowed

from mathesar.api.ui.serializers.users import UserSerializer, DatabaseRoleSerializer, SchemaRoleSerializer
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.ui.permissions.users import UserAccessPolicy
from mathesar.models.users import User, DatabaseRole, SchemaRole


class UserViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = UserAccessPolicy


class DatabaseRoleViewSet(viewsets.ModelViewSet):
    queryset = DatabaseRole.objects.all().order_by('id')
    serializer_class = DatabaseRoleSerializer
    pagination_class = DefaultLimitOffsetPagination

    def update(self, request, database_pk=None, pk=None):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, database_pk=None, pk=None):
        raise MethodNotAllowed(request.method)


class SchemaRoleViewSet(viewsets.ModelViewSet):
    queryset = SchemaRole.objects.all().order_by('id')
    serializer_class = SchemaRoleSerializer
    pagination_class = DefaultLimitOffsetPagination

    def update(self, request, database_pk=None, pk=None):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, database_pk=None, pk=None):
        raise MethodNotAllowed(request.method)
