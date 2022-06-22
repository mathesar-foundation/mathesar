from django_filters import rest_framework as filters

from rest_framework import status, viewsets
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin
from rest_framework.response import Response
from rest_framework.decorators import action

from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.queries import QuerySerializer
from mathesar.models import Query

class QueryViewSet(CreateModelMixin, UpdateModelMixin, RetrieveModelMixin, ListModelMixin, viewsets.GenericViewSet):
    serializer_class = QuerySerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)

    def get_queryset(self):
        return Query.objects.all().order_by('-created_at')

    def destroy(self, request, pk=None):
        query = self.get_object()
        query.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['get'], detail=True)
    def columns(self, request, pk=None):
        query = self.get_object()
        cols = query.get_columns_described()
        return Response(cols)

    @action(methods=['get'], detail=True)
    def records(self, request, pk=None):
        query = self.get_object()
        cols = query.get_columns_described()
        return Response(cols)
