from django_filters import rest_framework as filters

from rest_framework import viewsets
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin
from rest_framework.response import Response
from rest_framework.decorators import action

from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.queries import QuerySerializer
from mathesar.models.query import UIQuery


class QueryViewSet(CreateModelMixin, UpdateModelMixin, RetrieveModelMixin, ListModelMixin, DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = QuerySerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)

    def get_queryset(self):
        return UIQuery.objects.all().order_by('-created_at')

    @action(methods=['get'], detail=True)
    def columns(self, request, pk=None):
        query = self.get_object()
        output_col_desc = query.get_output_columns_described()
        return Response(output_col_desc)

    @action(methods=['get'], detail=True)
    def records(self, request, pk=None):
        query = self.get_object()
        records = query.get_records()
        return Response(records)
