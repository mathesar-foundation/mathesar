from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from mathesar.api.filters import SchemaFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.schemas import SchemaSerializer
from mathesar.models import Schema
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

        schema = create_schema_and_object(serializer.validated_data['name'],
                                          serializer.validated_data['database'])
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
