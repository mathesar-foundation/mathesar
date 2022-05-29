from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework.response import Response
from sqlalchemy_filters.exceptions import BadSortFormat, SortFieldNotFound

import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
from db.constraints.utils import ConstraintType
from db.functions.exceptions import (
    BadDBFunctionFormat, ReferencedColumnsDontExist, UnknownDBFunctionID
)
from db.records.exceptions import (
    BadGroupFormat, GroupFieldNotFound, InvalidGroupType, UndefinedFunction
)
from mathesar.api.pagination import TableLimitOffsetGroupPagination
from mathesar.api.serializers.records import RecordListParameterSerializer, RecordSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.functions.operations.convert import rewrite_db_function_spec_column_ids_to_names
from mathesar.models import Constraint, Table
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
        table = get_table_or_404(table_pk)

        filter_unprocessed = serializer.validated_data['filter']
        order_by = serializer.validated_data['order_by']
        grouping = serializer.validated_data['grouping']
        fk_previews = serializer.validated_data['fk_previews']
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
        preview_columns = None
        if fk_previews:
            table_constraints = Constraint.objects.filter(table__id=self.kwargs['table_pk'])
            fk_constraints = [table_constraint for table_constraint in table_constraints if table_constraint.type == ConstraintType.FOREIGN_KEY.value]
            preview_columns = {}
            if fk_previews == 'all':
                for fk_constraint in fk_constraints:
                    # For now only single column foreign key is used.
                    constrained_column = fk_constraint.columns[0]
                    referent_column = fk_constraint.referent_columns[0]
                    referent_table = referent_column.table
                    referent_table_settings = referent_column.table.settings
                    preview_data_columns = referent_table_settings.preview_columns.columns.all()
                    preview_columns[constrained_column] = {
                        'table': referent_table,
                        'columns': preview_data_columns,
                        'referent_column': referent_column,
                    }
            elif fk_previews == 'auto':
                table_constraints = Constraint.objects.filter(table__id=self.kwargs['table_pk'])
        try:

            records = paginator.paginate_queryset(
                self.get_queryset(), request, table, column_names_to_ids,
                filters=filter_processed,
                order_by=name_converted_order_by,
                grouping=name_converted_group_by,
                duplicate_only=serializer.validated_data['duplicate_only'],
                preview_columns=preview_columns
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
        serializer = RecordSerializer(
            {'id': pk},
            data=request.data,
            context=self.get_serializer_context(table),
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        table.delete_record(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_serializer_context(self, table):
        columns_map = table.get_column_name_id_bidirectional_map()
        context = {'columns_map': columns_map, 'table': table}
        return context
