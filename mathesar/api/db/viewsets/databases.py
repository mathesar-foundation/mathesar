from django_filters import rest_framework as filters
from rest_access_policy import AccessViewSetMixin
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar.api.db.permissions.database import DatabaseAccessPolicy
from mathesar.models.base import Database
from mathesar.api.dj_filters import DatabaseFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination

from mathesar.api.serializers.databases import DatabaseSerializer

from db.functions.operations.check_support import get_supported_db_functions
from mathesar.api.serializers.functions import DBFunctionSerializer
from db.types.base import get_available_known_db_types
from db.types.install import uninstall_mathesar_from_database
from mathesar.api.serializers.db_types import DBTypeSerializer
from mathesar.api.exceptions.validation_exceptions.exceptions import EditingDBCredentialsNotAllowed


class DatabaseViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    serializer_class = DatabaseSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = DatabaseFilter
    access_policy = DatabaseAccessPolicy

    def get_queryset(self):
        return self.access_policy.scope_queryset(
            self.request,
            Database.objects.all().order_by('-created_at')
        )

    def create(self, request):
        serializer = DatabaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credentials = serializer.validated_data
        Database.objects.create(
            name=credentials['name'],
            db_name=credentials['db_name'],
            username=credentials['username'],
            password=credentials['password'],
            host=credentials['host'],
            port=credentials['port']
        ).save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        db_object = self.get_object()
        if db_object.editable:
            serializer = DatabaseSerializer(db_object, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        raise EditingDBCredentialsNotAllowed()

    def destroy(self, request, pk=None):
        should_uninstall = request.query_params.get('del_msar_schemas')
        db_object = self.get_object()
        db_object.delete(
            should_uninstall=should_uninstall
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['get'], detail=True)
    def functions(self, request, pk=None):
        database = self.get_object()
        engine = database._sa_engine
        supported_db_functions = get_supported_db_functions(engine)
        serializer = DBFunctionSerializer(supported_db_functions, many=True)
        return Response(serializer.data)

    @action(methods=['get'], detail=True)
    def types(self, request, pk=None):
        database = self.get_object()
        engine = database._sa_engine
        available_known_db_types = get_available_known_db_types(engine)
        serializer = DBTypeSerializer(available_known_db_types, many=True)
        return Response(serializer.data)
