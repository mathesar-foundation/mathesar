from psycopg2.errors import NotNullViolation

from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.renderers import BrowsableAPIRenderer
from sqlalchemy.exc import IntegrityError
from sqlalchemy_filters.exceptions import BadSortFormat, SortFieldNotFound

from mathesar.functions.operations.convert import rewrite_db_function_spec_column_ids_to_names
from db.records.exceptions import BadGroupFormat, GroupFieldNotFound, InvalidGroupType

import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
from mathesar.api.utils import get_column_name_id_bidirectional_map, get_table_or_404
from mathesar.api.pagination import TableLimitOffsetGroupPagination
from mathesar.api.serializers.records import RecordListParameterSerializer, RecordSerializer
from mathesar.api.utils import get_table_or_404
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
    # db/functions/operations/deserialize.py::get_db_function_from_ma_function_spec function doc>
    # For sorting parameter formatting, see:
    # https://github.com/centerofci/sqlalchemy-filters#sort-format
    def list(self, request, table_pk=None):
        paginator = TableLimitOffsetGroupPagination()

        serializer = RecordListParameterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)

        filter_unprocessed = serializer.validated_data['filter']
        filter_processed = None
        table = get_table_or_404(table_pk)

        try:
            if filter_unprocessed:
                table = get_table_or_404(table_pk)
                column_ids_to_names = table.get_dj_column_id_to_name_mapping()
                filter_processed = rewrite_db_function_spec_column_ids_to_names(
                    column_ids_to_names=column_ids_to_names,
                    spec=filter_unprocessed,
                )
            records = paginator.paginate_queryset(
                self.get_queryset(), request, table_pk,
                filter=filter_processed,
                order_by=serializer.validated_data['order_by'],
                grouping=serializer.validated_data['grouping'],
                duplicate_only=serializer.validated_data['duplicate_only'],
            )
        except (BadDBFunctionFormat, UnknownDBFunctionID, ReferencedColumnsDontExist) as e:
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
        serializer = RecordSerializer(
            records,
            many=True,
            context=self.get_serializer_context(table)
        )
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        record = table.get_record(pk)
        if not record:
            raise NotFound
        serializer = RecordSerializer(record, context=self.get_serializer_context(table))
        return Response(serializer.data)

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        serializer = RecordSerializer(data=request.data, context=self.get_serializer_context(table))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        serializer = RecordSerializer({'id': pk}, data=request.data, context=self.get_serializer_context(table), partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        table.delete_record(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_serializer_context(self, table):
        columns_map = get_column_name_id_bidirectional_map(table.id)
        context = {'columns_map': columns_map, 'table': table}
        return context
