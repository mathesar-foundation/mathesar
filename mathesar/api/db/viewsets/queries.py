import json
from django_filters import rest_framework as filters

from rest_framework import viewsets
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin
from rest_framework.response import Response
from rest_framework.decorators import action
from mathesar.api.dj_filters import UIQueryFilter

from mathesar.api.exceptions.query_exceptions.exceptions import DeletedColumnAccess, DeletedColumnAccessAPIException
from mathesar.api.pagination import DefaultLimitOffsetPagination, TableLimitOffsetPagination
from mathesar.api.serializers.queries import BaseQuerySerializer, QuerySerializer
from mathesar.api.serializers.records import RecordListParameterSerializer
from mathesar.models.query import UIQuery


class QueryViewSet(
        CreateModelMixin,
        UpdateModelMixin,
        RetrieveModelMixin,
        ListModelMixin,
        DestroyModelMixin,
        viewsets.GenericViewSet
):
    serializer_class = QuerySerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = UIQueryFilter

    def get_queryset(self):
        queryset = UIQuery.objects.all()
        schema_id = self.request.query_params.get('schema')
        if schema_id:
            queryset = queryset.filter(base_table__schema=schema_id)
        return queryset.order_by('-created_at')

    @action(methods=['get'], detail=True)
    def records(self, request, pk=None):
        paginator = TableLimitOffsetPagination()
        query = self.get_object()
        serializer = RecordListParameterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)
        records = paginator.paginate_queryset(
            queryset=self.get_queryset(),
            request=request,
            table=query,
            filters=serializer.validated_data['filter'],
            order_by=serializer.validated_data['order_by'],
            grouping=serializer.validated_data['grouping'],
            search=serializer.validated_data['search_fuzzy'],
            duplicate_only=serializer.validated_data['duplicate_only'],
        )
        return paginator.get_paginated_response(records)

    @action(methods=['get'], detail=True)
    def columns(self, request, pk=None):
        query = self.get_object()
        output_col_desc = query.output_columns_described
        return Response(output_col_desc)

    @action(methods=['get'], detail=True)
    def results(self, request, pk=None):
        paginator = TableLimitOffsetPagination()
        query = self.get_object()
        serializer = RecordListParameterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)
        records = paginator.paginate_queryset(
            queryset=self.get_queryset(),
            request=request,
            table=query,
            filters=serializer.validated_data['filter'],
            order_by=serializer.validated_data['order_by'],
            grouping=serializer.validated_data['grouping'],
            search=serializer.validated_data['search_fuzzy'],
            duplicate_only=serializer.validated_data['duplicate_only'],
        )
        paginated_records = paginator.get_paginated_response(records)
        columns = query.output_columns_simple
        column_metadata = query.all_columns_description_map
        return Response(
            {
                "records": paginated_records.data,
                "output_columns": columns,
                "column_metadata": column_metadata,
                "parameters": {k: json.loads(request.GET[k]) for k in request.GET},
            }
        )

    @action(methods=['post'], detail=False)
    def run(self, request):
        params = request.data.pop("parameters", {})
        request.GET |= {k: [json.dumps(v)] for k, v in params.items()}
        paginator = TableLimitOffsetPagination()
        input_serializer = BaseQuerySerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        query = UIQuery(**input_serializer.validated_data)
        output_serializer = BaseQuerySerializer(query)
        try:
            query.replace_transformations_with_processed_transformations()
            record_serializer = RecordListParameterSerializer(data=request.GET)
            record_serializer.is_valid(raise_exception=True)
            records = paginator.paginate_queryset(
                queryset=self.get_queryset(),
                request=request,
                table=query,
                filters=record_serializer.validated_data['filter'],
                order_by=record_serializer.validated_data['order_by'],
                grouping=record_serializer.validated_data['grouping'],
                search=record_serializer.validated_data['search_fuzzy'],
                duplicate_only=record_serializer.validated_data['duplicate_only'],
            )
            paginated_records = paginator.get_paginated_response(records)
        except DeletedColumnAccess as e:
            raise DeletedColumnAccessAPIException(e, query=output_serializer.data)
        columns = query.output_columns_simple
        column_metadata = query.all_columns_description_map

        def _get_param_val(val):
            try:
                ret_val = json.loads(val)
            except json.JSONDecodeError:
                ret_val = val
            return ret_val
        return Response(
            {
                "query": output_serializer.data,
                "records": paginated_records.data,
                "output_columns": columns,
                "column_metadata": column_metadata,
                "parameters": {k: _get_param_val(request.GET[k]) for k in request.GET},
            }
        )
