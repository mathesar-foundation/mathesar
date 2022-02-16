from psycopg2.errors import NotNullViolation

from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.renderers import BrowsableAPIRenderer
from sqlalchemy.exc import IntegrityError
from sqlalchemy_filters.exceptions import BadFilterFormat, BadSortFormat, FilterFieldNotFound, SortFieldNotFound

import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
from db.records.exceptions import BadGroupFormat, GroupFieldNotFound, InvalidGroupType
from mathesar.api.pagination import TableLimitOffsetGroupPagination
from mathesar.api.serializers.records import RecordListParameterSerializer, RecordSerializer
from mathesar.api.utils import get_column_id_name_bidirectional_map, get_table_or_404
from mathesar.models import Table
from mathesar.utils.json import MathesarJSONRenderer


class RecordViewSet(viewsets.ViewSet):
    # There is no 'update' method.
    # We're not supporting PUT requests because there aren't a lot of use cases
    # where the entire record needs to be replaced, PATCH suffices for updates.
    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

    renderer_classes = [MathesarJSONRenderer, BrowsableAPIRenderer]

    # For filter parameter formatting, see:
    # https://github.com/centerofci/sqlalchemy-filters#filters-format
    # For sorting parameter formatting, see:
    # https://github.com/centerofci/sqlalchemy-filters#sort-format
    def list(self, request, table_pk=None):
        paginator = TableLimitOffsetGroupPagination()

        serializer = RecordListParameterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)

        try:
            records = paginator.paginate_queryset(
                self.get_queryset(), request, table_pk,
                filters=serializer.validated_data['filters'],
                order_by=serializer.validated_data['order_by'],
                grouping=serializer.validated_data['grouping'],
            )
        except (BadFilterFormat, FilterFieldNotFound) as e:
            raise database_api_exceptions.BadFilterAPIException(
                e,
                field='filters',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except (BadSortFormat, SortFieldNotFound) as e:
            raise database_api_exceptions.BadSortAPIException(
                e,
                field='order_by',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except (BadGroupFormat, GroupFieldNotFound, InvalidGroupType) as e:
            raise database_api_exceptions.BadGroupAPIException(
                e,
                field='grouping',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Prefetch column names to avoid N+1 queries
        columns_map = get_column_id_name_bidirectional_map(table_pk)
        serializer = RecordSerializer(
            records,
            many=True,
            context={'request': request, 'columns_map': columns_map.inverse, 'table_pk': table_pk}
        )
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        record = table.get_record(pk)
        if not record:
            raise NotFound
        columns_map = get_column_id_name_bidirectional_map(table.id)
        serializer = RecordSerializer(record, context={'columns_map': columns_map.inverse, 'table_pk': table_pk})
        return Response(serializer.data)

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        # We only support adding a single record through the API.
        assert isinstance((request.data), dict)
        columns_map = get_column_id_name_bidirectional_map(table.id)
        data = {columns_map[int(column_id)]: value for column_id, value in request.data.items()}
        try:
            record = table.create_record_or_records(data)
        except IntegrityError as e:
            if type(e.orig) == NotNullViolation:
                raise database_api_exceptions.NotNullViolationAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST,
                    table=table
                )
            else:
                raise database_api_exceptions.MathesarAPIException(e, status_code=status.HTTP_400_BAD_REQUEST)
        serializer = RecordSerializer(record, context={'columns_map': columns_map.inverse, 'table_pk': table_pk})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        columns_map = get_column_id_name_bidirectional_map(table.id)
        data = {columns_map[int(column_id)]: value for column_id, value in request.data.items()}
        record = table.update_record(pk, data)
        serializer = RecordSerializer(record, context={'columns_map': columns_map.inverse, 'table_pk': table_pk})
        return Response(serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        table.delete_record(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
