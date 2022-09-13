from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework.response import Response
from sqlalchemy_filters.exceptions import BadSortFormat, SortFieldNotFound

from mathesar.api.exceptions.error_codes import ErrorCodes
import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
import mathesar.api.exceptions.generic_exceptions.base_exceptions as generic_api_exceptions
from db.functions.exceptions import (
    BadDBFunctionFormat, ReferencedColumnsDontExist, UnknownDBFunctionID,
)
from db.records.exceptions import (
    BadGroupFormat, GroupFieldNotFound, InvalidGroupType, UndefinedFunction,
)
from mathesar.api.pagination import TableLimitOffsetPagination
from mathesar.api.serializers.records import RecordListParameterSerializer, RecordSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.functions.operations.convert import rewrite_db_function_spec_column_ids_to_names
from mathesar.models.base import Table
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
        paginator = TableLimitOffsetPagination()

        serializer = RecordListParameterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)
        table = get_table_or_404(table_pk)

        filter_unprocessed = serializer.validated_data['filter']
        order_by = serializer.validated_data['order_by']
        grouping = serializer.validated_data['grouping']
        search_fuzzy = serializer.validated_data['search_fuzzy']
        filter_processed = None
        column_names_to_ids = table.get_column_name_id_bidirectional_map()
        column_ids_to_names = column_names_to_ids.inverse
        if filter_unprocessed:
            table = get_table_or_404(table_pk)
            filter_processed = rewrite_db_function_spec_column_ids_to_names(
                column_ids_to_names=column_ids_to_names,
                spec=filter_unprocessed,
            )
        # Replace column id value used in the `field` property with column name
        name_converted_group_by = None
        if grouping:
            group_by_columns_names = [column_ids_to_names[column_id] for column_id in grouping['columns']]
            name_converted_group_by = {**grouping, 'columns': group_by_columns_names}
        name_converted_order_by = [{**column, 'field': column_ids_to_names[column['field']]} for column in order_by]
        name_converted_search = [{**column, 'column': column_ids_to_names[column['field']]} for column in search_fuzzy]

        try:

            records = paginator.paginate_queryset(
                self.get_queryset(), request, table, column_names_to_ids,
                filters=filter_processed,
                order_by=name_converted_order_by,
                grouping=name_converted_group_by,
                search=name_converted_search,
                duplicate_only=serializer.validated_data['duplicate_only']
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
        except UndefinedFunction as e:
            raise database_api_exceptions.UndefinedFunctionAPIException(
                e,
                details=e.args[0],
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
        # TODO refactor to use serializer for more DRY response logic
        paginator = TableLimitOffsetPagination()
        record_filters = {
            "equal": [
                {"column_name": [table.primary_key_column_name]},
                {"literal": [pk]}
            ]
        }
        column_names_to_ids = table.get_column_name_id_bidirectional_map()
        column_ids_to_names = column_names_to_ids.inverse
        records = paginator.paginate_queryset(
            table,
            request,
            table,
            column_ids_to_names,
            filters=record_filters
        )
        if not records:
            raise NotFound
        serializer = RecordSerializer(
            records,
            many=True,
            context=self.get_serializer_context(table)
        )
        return paginator.get_paginated_response(serializer.data)

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        serializer = RecordSerializer(data=request.data, context=self.get_serializer_context(table))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # TODO refactor to use serializer for more DRY response logic
        column_name_id_map = table.get_column_name_id_bidirectional_map()
        table_pk_column_id = column_name_id_map[table.primary_key_column_name]
        pk_value = serializer.data[table_pk_column_id]
        paginator = TableLimitOffsetPagination()
        record_filters = {
            "equal": [
                {"column_name": [table.primary_key_column_name]},
                {"literal": [pk_value]}
            ]
        }
        column_names_to_ids = table.get_column_name_id_bidirectional_map()
        column_ids_to_names = column_names_to_ids.inverse
        records = paginator.paginate_queryset(
            table,
            request,
            table,
            column_ids_to_names,
            filters=record_filters
        )
        serializer = RecordSerializer(
            records,
            many=True,
            context=self.get_serializer_context(table)
        )
        response = paginator.get_paginated_response(serializer.data)
        response.status_code = status.HTTP_201_CREATED
        return response

    def partial_update(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        serializer = RecordSerializer(
            {'id': pk},
            data=request.data,
            context=self.get_serializer_context(table),
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # TODO refactor to use serializer for more DRY response logic
        paginator = TableLimitOffsetPagination()
        record_filters = {
            "equal": [
                {"column_name": [table.primary_key_column_name]},
                {"literal": [pk]}
            ]
        }
        column_names_to_ids = table.get_column_name_id_bidirectional_map()
        column_ids_to_names = column_names_to_ids.inverse
        records = paginator.paginate_queryset(
            table,
            request,
            table,
            column_ids_to_names,
            filters=record_filters
        )
        serializer = RecordSerializer(
            records,
            many=True,
            context=self.get_serializer_context(table)
        )
        return paginator.get_paginated_response(serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        if table.get_record(pk) is None:
            raise generic_api_exceptions.NotFoundAPIException(
                NotFound,
                error_code=ErrorCodes.RecordNotFound.value,
                message="Record doesn't exist"
            )
        table.delete_record(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_serializer_context(self, table):
        columns_map = table.get_column_name_id_bidirectional_map()
        context = {'columns_map': columns_map, 'table': table}
        return context
