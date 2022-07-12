from django_filters import rest_framework as filters

from rest_framework import viewsets
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin
from rest_framework.response import Response
from rest_framework.decorators import action

from mathesar.api.pagination import DefaultLimitOffsetPagination, TableLimitOffsetGroupPagination
from mathesar.api.serializers.queries import QuerySerializer
from mathesar.models.query import UIQuery


class QueryViewSet(CreateModelMixin, UpdateModelMixin, RetrieveModelMixin, ListModelMixin, DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = QuerySerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)

    def get_queryset(self):
        return UIQuery.objects.all().order_by('-created_at')


    @action(methods=['get'], detail=True)
    def records(self, request, pk=None):
        paginator = TableLimitOffsetGroupPagination()
        query = self.get_object()
        if query.not_partial:
            records = paginator.paginate_queryset(
                queryset=self.get_queryset(),
                request=request,
                table=query,
                column_name_id_bidirectional_map=dict(),
            )
            return paginator.get_paginated_response(records)
    @action(methods=['get'], detail=True)
    def columns(self, request, pk=None):
        query = self.get_object()
        if query.not_partial:
            output_col_desc = query.output_columns_described
            return Response(output_col_desc)
