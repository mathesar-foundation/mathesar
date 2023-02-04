from django.contrib.auth import get_user_model
from rest_access_policy import AccessViewSetMixin
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from mathesar.api.ui.permissions.database_role import DatabaseRoleAccessPolicy
from mathesar.api.ui.permissions.schema_role import SchemaRoleAccessPolicy
from mathesar.api.ui.serializers.users import (
    ChangePasswordSerializer, PasswordResetSerializer, UserSerializer, DatabaseRoleSerializer,
    SchemaRoleSerializer,
)
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.ui.permissions.users import UserAccessPolicy
from mathesar.models.users import DatabaseRole, SchemaRole


class UserViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    queryset = get_user_model().objects.all().order_by('id')
    serializer_class = UserSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = UserAccessPolicy

    @action(methods=['post'], detail=True)
    def password_reset(self, request, pk=None):
        serializer = PasswordResetSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = get_object_or_404(get_user_model(), pk=pk)
        password = serializer.validated_data["password"]
        user.set_password(password)
        # Make sure we redirect user to change password set by the admin on login
        user.password_change_needed = True
        user.save()
        return Response(status=status.HTTP_200_OK)

    @action(methods=['post'], detail=False)
    def password_change(self, request):
        serializer = ChangePasswordSerializer(
            instance=request.user,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_200_OK)


class DatabaseRoleViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    queryset = DatabaseRole.objects.all().order_by('id')
    serializer_class = DatabaseRoleSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = DatabaseRoleAccessPolicy

    def get_queryset(self):
        return self.access_policy.scope_queryset(
            self.request, super().get_queryset()
        )

    def update(self, request, pk=None):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, pk=None):
        raise MethodNotAllowed(request.method)


class SchemaRoleViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    queryset = SchemaRole.objects.all().order_by('id')
    serializer_class = SchemaRoleSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = SchemaRoleAccessPolicy

    def get_queryset(self):
        return self.access_policy.scope_queryset(
            self.request, super().get_queryset()
        )

    def update(self, request, pk=None):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, pk=None):
        raise MethodNotAllowed(request.method)
