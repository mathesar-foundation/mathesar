from django_filters import rest_framework as filters
from psycopg2.errors import CheckViolation, InvalidTextRepresentation
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from sqlalchemy.exc import DataError, IntegrityError, ProgrammingError

from db.types.exceptions import UnsupportedTypeException
from db.columns.exceptions import NotNullError, ForeignKeyError, TypeMismatchError, UniqueValueError, ExclusionError
from mathesar.api.serializers.dependents import DependentFilterSerializer, DependentSerializer
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
from mathesar.utils.tables import get_table_column_types
from mathesar.utils.joins import get_processed_joinable_tables


class TableViewSet(CreateModelMixin, RetrieveModelMixin, ListModelMixin, viewsets.GenericViewSet):
    serializer_class = TableSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TableFilter

    def get_queryset(self):
        # Better to use prefetch_related for schema and database,
        # because select_related would lead to duplicate object instances and could result in multiple engines instances
        # We prefetch `columns` using Django prefetch_related to get list of column objects and
        # then prefetch column properties like `column name` using prefetch library.
        return Table.objects.prefetch_related('schema', 'schema__database', 'columns').prefetch('_sa_table', 'columns').order_by('-created_at')

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
        serializer = DependentFilterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)
        types_exclude = serializer.validated_data['exclude']

        table = self.get_object()
        serializer = DependentSerializer(table.get_dependents(types_exclude), many=True, context={'request': request})
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
        except NotNullError as e:
            raise database_api_exceptions.NotNullViolationAPIException(
                e,
                message='Null values cannot be inserted into this column',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ForeignKeyError as e:
            raise database_api_exceptions.ForeignKeyViolationAPIException(
                e,
                message='Cannot add an invalid reference to a record',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except TypeMismatchError as e:
            raise database_api_exceptions.TypeMismatchViolationAPIException(
                e,
                message='Type mismatch error',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except UniqueValueError as e:
            raise database_api_exceptions.UniqueImportViolationAPIException(
                e,
                message='This column has uniqueness constraint set so non-unique values cannot be inserted',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ExclusionError as e:
            raise database_api_exceptions.ExclusionViolationAPIException(
                e,
                message='This record violates exclusion constraint',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError as e:
            raise database_base_api_exceptions.IntegrityAPIException(
                e,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ProgrammingError as e:
            raise database_base_api_exceptions.ProgrammingAPIException(
                e,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        # Reload the table to avoid cached properties
        existing_table = get_table_or_404(target_table.id)
        serializer = TableSerializer(
            existing_table, context={'request': request}
        )
        table_data = serializer.data
        return Response(table_data)
