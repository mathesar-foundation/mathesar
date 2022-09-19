from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from mathesar.api.dj_filters import SchemaFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.dependents import DependentSerializer, DependentFilterSerializer
from mathesar.api.serializers.schemas import SchemaSerializer
from mathesar.models.base import Schema
from mathesar.utils.schemas import create_schema_and_object


class SchemaViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    serializer_class = SchemaSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = SchemaFilter

    def get_queryset(self):
        return Schema.objects.all().order_by('-created_at')

    def create(self, request):
        serializer = SchemaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        schema = create_schema_and_object(
            serializer.validated_data['name'],
            serializer.validated_data['database'],
            comment=serializer.validated_data.get('description')
        )
        serializer = SchemaSerializer(schema)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = SchemaSerializer(
            data=request.data, context={'request': request}, partial=True
        )
        serializer.is_valid(raise_exception=True)

        schema = self.get_object()
        schema.update_sa_schema(serializer.validated_data)

        # Reload the schema to avoid cached properties
        schema = self.get_object()
        schema.clear_name_cache()
        serializer = SchemaSerializer(schema, context={'request': request})
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        schema = self.get_object()
        schema.delete_sa_schema()
        schema.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['get'], detail=True)
    def dependents(self, request, pk=None):
        serializer = DependentFilterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)
        types_exclude = serializer.validated_data['filter'].get('types_exclude', [])

        schema = self.get_object()
        serializer = DependentSerializer(schema.get_dependents(types_exclude), many=True, context={'request': request})
        return Response(serializer.data)
