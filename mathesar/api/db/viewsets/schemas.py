from django_filters import rest_framework as filters
from rest_access_policy import AccessViewSetMixin
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from mathesar.api.db.permissions.schema import SchemaAccessPolicy
from mathesar.api.dj_filters import SchemaFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.dependents import DependentSerializer, DependentFilterSerializer
from mathesar.api.serializers.schemas import SchemaSerializer
from mathesar.models.base import Schema
from mathesar.utils.schemas import create_schema_and_object
from mathesar.api.exceptions.validation_exceptions.exceptions import EditingPublicSchemaIsDisallowed


class SchemaViewSet(AccessViewSetMixin, viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    serializer_class = SchemaSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = SchemaFilter
    access_policy = SchemaAccessPolicy

    def get_queryset(self):
        qs = Schema.objects.all().order_by('-created_at')
        return self.access_policy.scope_viewset_queryset(self.request, qs)

    def create(self, request):
        serializer = SchemaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        database_name = serializer.validated_data['database'].name
        schema = create_schema_and_object(
            serializer.validated_data['name'],
            database_name,
            comment=serializer.validated_data.get('description')
        )
        serializer = SchemaSerializer(schema, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = SchemaSerializer(
            data=request.data, context={'request': request}, partial=True
        )
        serializer.is_valid(raise_exception=True)

        schema = self.get_object()

        # We forbid editing the public schema
        if schema.name == "public":
            raise EditingPublicSchemaIsDisallowed()

        schema.update_sa_schema(serializer.validated_data)

        # Reload the schema to avoid cached properties
        schema = self.get_object()
        schema.clear_name_cache()
        serializer = SchemaSerializer(schema, context={'request': request})
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        schema = self.get_object()
        schema.delete_sa_schema()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['get'], detail=True)
    def dependents(self, request, pk=None):
        serializer = DependentFilterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)
        types_exclude = serializer.validated_data['exclude']

        schema = self.get_object()
        serializer = DependentSerializer(schema.get_dependents(types_exclude), many=True, context={'request': request})
        return Response(serializer.data)
