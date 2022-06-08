from django_filters import rest_framework as filters
from psycopg2.errors import InvalidTextRepresentation, CheckViolation
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.response import Response
from sqlalchemy.exc import DataError, IntegrityError

from db.tables.operations.select import get_oid_from_table
from db.tables.operations.split import extract_columns_from_table
from mathesar.api.exceptions.database_exceptions import (
    exceptions as database_api_exceptions,
    base_exceptions as database_base_api_exceptions,
)
from db.types.exceptions import UnsupportedTypeException
from mathesar.api.dj_filters import TableFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.tables import (
    SplitTableResponseSerializer, SplitTableRequestSerializer, TableSerializer,
    TablePreviewSerializer,
)
from mathesar.models import Table
from mathesar.reflection import reflect_db_objects
from mathesar.utils.tables import (
    get_table_column_types
)


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
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['get'], detail=True)
    def type_suggestions(self, request, pk=None):
        table = self.get_object()
        col_types = get_table_column_types(table)
        return Response(col_types)

    @action(methods=['post'], detail=True)
    def split_table(self, request, pk=None):
        table = self.get_object()
        serializer = SplitTableRequestSerializer(data=request.data, context={"request": request, 'table': table})
        if serializer.is_valid(True):
            extracted_columns = [column.name for column in serializer.validated_data['extract_columns']]
            extracted_table_name = serializer.validated_data['extract_table_name']
            remainder_table_name = serializer.validated_data['remainder_table_name']
            drop_original_table = serializer.validated_data['drop_original_table']
            engine = table._sa_engine
            extracted_table, remainder_table, remainder_fk = extract_columns_from_table(
                table.name,
                extracted_columns,
                extracted_table_name,
                remainder_table_name,
                table.schema.name,
                engine,
                drop_original_table=drop_original_table
            )
            extracted_table_oid = get_oid_from_table(extracted_table.name, extracted_table.schema, engine)
            remainder_table_oid = get_oid_from_table(remainder_table.name, remainder_table.schema, engine)
            reflect_db_objects(skip_cache_check=True)
            extracted_table_obj = Table.objects.get(oid=extracted_table_oid)
            remainder_table_obj = Table.objects.get(oid=remainder_table_oid)
            split_table_response = {'extracted_table': extracted_table_obj.id, 'remainder_table': remainder_table_obj.id}
            response_serializer = SplitTableResponseSerializer(data=split_table_response)
            response_serializer.is_valid(True)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

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
