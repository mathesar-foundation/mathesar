from django_filters import rest_framework as filters
from psycopg2.errors import CheckViolation, InvalidTextRepresentation
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from sqlalchemy.exc import DataError, IntegrityError

from db.tables.operations.select import get_oid_from_table
from db.types.exceptions import UnsupportedTypeException
from mathesar.api.serializers.dependents import DependentSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.api.dj_filters import TableFilter
from mathesar.api.exceptions.database_exceptions import (
    base_exceptions as database_base_api_exceptions,
    exceptions as database_api_exceptions,
)
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.tables import (
    SplitTableRequestSerializer,
    SplitTableResponseSerializer,
    TablePreviewSerializer,
    TableSerializer,
    TableImportSerializer,
    MoveTableRequestSerializer
)
from mathesar.models.base import Table
from mathesar.state.django import reflect_db_objects, reflect_tables_from_schema
from mathesar.state import reset_reflection, get_cached_metadata
from mathesar.utils.tables import get_table_column_types
from mathesar.utils.joins import get_processed_joinable_tables


class TableViewSet(CreateModelMixin, RetrieveModelMixin, ListModelMixin, viewsets.GenericViewSet):
    serializer_class = TableSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TableFilter

    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

    def partial_update(self, request, pk=None):
        table = self.get_object()
        serializer = TableSerializer(
            table, data=request.data, context={'request': request}, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Reload the table to avoid cached properties
        table = self.get_object()
        serializer = TableSerializer(table, context={'request': request})
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        table = self.get_object()
        table.delete_sa_table()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['get'], detail=True)
    def dependents(self, request, pk=None):
        table = self.get_object()
        serializer = DependentSerializer(table.dependents, many=True, context={'request': request})
        return Response(serializer.data)

    @action(methods=['get'], detail=True)
    def joinable_tables(self, request, pk=None):
        table = self.get_object()
        limit = request.query_params.get('limit')
        offset = request.query_params.get('offset')
        max_depth = request.query_params.get('max_depth', 2)
        processed_joinable_tables = get_processed_joinable_tables(
            table, limit=limit, offset=offset, max_depth=max_depth
        )
        return Response(processed_joinable_tables)

    @action(methods=['get'], detail=True)
    def type_suggestions(self, request, pk=None):
        table = self.get_object()
        col_types = get_table_column_types(table)
        return Response(col_types)

    @action(methods=['post'], detail=True)
    def split_table(self, request, pk=None):
        table = self.get_object()
        column_names_id_map = table.get_column_name_id_bidirectional_map()
        serializer = SplitTableRequestSerializer(data=request.data, context={"request": request, 'table': table})
        if serializer.is_valid(True):
            # We need to get the column names before splitting the table,
            # as they are the only reference to the new column after it is moved to a new table
            columns_to_extract = serializer.validated_data['extract_columns']
            extracted_table_name = serializer.validated_data['extracted_table_name']
            extracted_table, remainder_table, _ = table.split_table(
                columns_to_extract=columns_to_extract,
                extracted_table_name=extracted_table_name,
                column_names_id_map=column_names_id_map,
            )
            split_table_response = {
                'extracted_table': extracted_table.id,
                'remainder_table': remainder_table.id
            }
            response_serializer = SplitTableResponseSerializer(data=split_table_response)
            response_serializer.is_valid(True)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['post'], detail=True)
    def move_columns(self, request, pk=None):
        table = self.get_object()
        serializer = MoveTableRequestSerializer(data=request.data, context={"request": request, 'table': table})
        if serializer.is_valid(True):
            target_table = serializer.validated_data['target_table']
            move_columns = serializer.validated_data['move_columns']
            table.move_columns(
                columns_to_move=move_columns,
                target_table=target_table,
            )
            return Response(status=status.HTTP_201_CREATED)

    @action(methods=['post'], detail=True)
    def previews(self, request, pk=None):
        table = self.get_object()
        serializer = TablePreviewSerializer(data=request.data, context={"request": request, 'table': table})
        serializer.is_valid(raise_exception=True)
        columns_field_key = "columns"
        columns = serializer.data[columns_field_key]
        table_data = TableSerializer(table, context={"request": request}).data
        try:
            preview_records = table.get_preview(columns)
        except (DataError, IntegrityError) as e:
            if type(e.orig) == InvalidTextRepresentation or type(e.orig) == CheckViolation:
                raise database_api_exceptions.InvalidTypeCastAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST,
                    field='columns'
                )
            else:
                raise database_base_api_exceptions.IntegrityAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST,
                    field='columns'
                )
        except UnsupportedTypeException as e:
            raise database_api_exceptions.UnsupportedTypeAPIException(
                e,
                field='columns',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        table_data.update(
            {
                # There's no way to reflect actual column data without
                # creating a view, so we just use the submission, assuming
                # no errors means we changed to the desired names and types
                "columns": columns,
                "records": preview_records
            }
        )

        return Response(table_data)

    @action(methods=['post'], detail=True)
    def existing_import(self, request, pk=None):
        temp_table = self.get_object()
        serializer = TableImportSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        target_table = serializer.validated_data['import_target']
        data_files = serializer.validated_data['data_files']
        mappings = serializer.validated_data['mappings']

        try:
            temp_table.insert_records_to_existing_table(
                target_table, data_files, mappings
            )
        except Exception as e:
            # ToDo raise specific exceptions.
            raise e
        # Reload the table to avoid cached properties
        existing_table = get_table_or_404(target_table.id)
        serializer = TableSerializer(
            existing_table, context={'request': request}
        )
        table_data = serializer.data
        return Response(table_data)
