from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from mathesar.models import Database
from mathesar.api.filters import DatabaseFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.serializers import DatabaseSerializer, TypeSerializer


class DatabaseViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    serializer_class = DatabaseSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = DatabaseFilter

    def get_queryset(self):
        return Database.objects.all().order_by('-created_at')

    @action(methods=['get'], detail=True)
    def types(self, request, pk=None):
        database = self.get_object()
        serializer = TypeSerializer(database.supported_types, many=True)
        return Response(serializer.data)
