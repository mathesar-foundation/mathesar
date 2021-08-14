import logging
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError, APIException
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters import rest_framework as filters
from psycopg2.errors import (
    DuplicateColumn, DuplicateTable, UndefinedFunction, UniqueViolation, UndefinedObject,
    InvalidTextRepresentation, CheckViolation, InvalidParameterValue
)
from sqlalchemy.exc import ProgrammingError, DataError, IntegrityError
from sqlalchemy_filters.exceptions import (
    BadFilterFormat, BadSortFormat, FilterFieldNotFound, SortFieldNotFound,
)

from db.types.alteration import UnsupportedTypeException

from mathesar.database.utils import get_non_default_database_keys
from mathesar.models import Table, Schema, DataFile, Database, Constraint
from mathesar.pagination import (
    ColumnLimitOffsetPagination, DefaultLimitOffsetPagination, TableLimitOffsetGroupPagination
)
from mathesar.serializers import (
    TableSerializer, SchemaSerializer, RecordSerializer, DataFileSerializer, ColumnSerializer,
    DatabaseSerializer, ConstraintSerializer, RecordListParameterSerializer, TablePreviewSerializer,
    TypeSerializer
)
from mathesar.utils.schemas import create_schema_and_object
from mathesar.utils.tables import (
    get_table_column_types, create_table_from_datafile, create_empty_table,
    gen_table_name
)
from mathesar.utils.datafiles import create_datafile
from mathesar.filters import SchemaFilter, TableFilter, DatabaseFilter

from db.records import BadGroupFormat, GroupFieldNotFound

logger = logging.getLogger(__name__)


def get_table_or_404(pk):
    try:
        table = Table.objects.get(id=pk)
    except Table.DoesNotExist:
        raise NotFound
    return table


class SchemaViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    def get_queryset(self):
        return Schema.objects.all().order_by('-created_at')
    serializer_class = SchemaSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = SchemaFilter

    def create(self, request):
        serializer = SchemaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        schema = create_schema_and_object(serializer.validated_data['name'],
                                          serializer.validated_data['database'])
        serializer = SchemaSerializer(schema)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = SchemaSerializer(
            data=request.data, context={'request': request}, partial=True
        )
        serializer.is_valid(raise_exception=True)

        schema = self.get_object()
        schema.update_sa_schema(serializer.validated_data)

        # Reload the schema to avoid cached properties
        schema = self.get_object()
        schema.clear_name_cache()
        serializer = SchemaSerializer(schema, context={'request': request})
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        schema = self.get_object()
        schema.delete_sa_schema()
        schema.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TableViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

    serializer_class = TableSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TableFilter

    def create(self, request):
        serializer = TableSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        if not serializer.validated_data['name']:
            name = gen_table_name(
                serializer.validated_data['schema'],
                serializer.validated_data['data_files'],
            )
        else:
            name = serializer.validated_data['name']

        try:
            if serializer.validated_data['data_files']:
                table = create_table_from_datafile(
                    serializer.validated_data['data_files'],
                    name,
                    serializer.validated_data['schema'],
                )
            else:
                table = create_empty_table(
                    name,
                    serializer.validated_data['schema']
                )
        except ProgrammingError as e:
            if type(e.orig) == DuplicateTable:
                raise ValidationError(
                    f"Relation {request.data['name']} already exists in schema {request.data['schema']}"
                )
            else:
                raise APIException(e)

        serializer = TableSerializer(table, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = TableSerializer(
            data=request.data, context={'request': request}, partial=True
        )
        serializer.is_valid(raise_exception=True)

        table = self.get_object()
        table.update_sa_table(serializer.validated_data)

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
    def previews(self, request, pk=None):
        table = self.get_object()
        serializer = TablePreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        columns = serializer.data["columns"]

        column_names = [col["name"] for col in columns]
        if not len(column_names) == len(set(column_names)):
            raise ValidationError("Column names must be distinct")
        if not len(columns) == len(table.sa_columns):
            raise ValidationError("Incorrect number of columns in request.")

        table_data = TableSerializer(table, context={"request": request}).data
        try:
            preview_records = table.get_preview(columns)
        except (DataError, IntegrityError) as e:
            if type(e.orig) == InvalidTextRepresentation or type(e.orig) == CheckViolation:
                raise ValidationError("Invalid type cast requested.")
            else:
                raise APIException
        except UnsupportedTypeException as e:
            raise ValidationError(e)
        except Exception as e:
            raise APIException(e)

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


class ColumnViewSet(viewsets.ViewSet):
    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

    def list(self, request, table_pk=None):
        paginator = ColumnLimitOffsetPagination()
        columns = paginator.paginate_queryset(self.get_queryset(), request, table_pk)
        serializer = ColumnSerializer(columns, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        try:
            column = table.sa_columns[int(pk)]
        except IndexError:
            raise NotFound
        serializer = ColumnSerializer(column)
        return Response(serializer.data)

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        # We only support adding a single column through the API.
        serializer = ColumnSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            column = table.add_column(request.data)
        except ProgrammingError as e:
            if type(e.orig) == DuplicateColumn:
                name = request.data['name']
                raise ValidationError(
                    f'Column {name} already exists'
                )
            else:
                raise APIException(e)
        except TypeError:
            raise ValidationError("Unknown type_option passed")
        except DataError as e:
            if (
                    type(e.orig) == InvalidParameterValue
                    or type(e.orig) == InvalidTextRepresentation
            ):
                raise ValidationError(
                    f'parameter dict {request.data["type_options"]} is'
                    f' invalid for type {request.data["type"]}'
                )
            else:
                raise APIException(e)

        out_serializer = ColumnSerializer(column)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        assert isinstance((request.data), dict)
        try:
            column = table.alter_column(pk, request.data)
        except ProgrammingError as e:
            if type(e.orig) == UndefinedFunction:
                raise ValidationError('This type cast is not implemented')
            else:
                raise ValidationError
        except IndexError:
            raise NotFound
        except TypeError:
            raise ValidationError("Unknown type_option passed")
        except DataError as e:
            if (
                    type(e.orig) == InvalidParameterValue
                    or type(e.orig) == InvalidTextRepresentation
            ):
                raise ValidationError(
                    f'parameter dict {request.data["type_options"]} is'
                    f' invalid for type {request.data["type"]}'
                )
            else:
                raise APIException(e)
        except Exception as e:
            raise APIException(e)
        serializer = ColumnSerializer(column)
        return Response(serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        try:
            table.drop_column(pk)
        except IndexError:
            raise NotFound
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecordViewSet(viewsets.ViewSet):
    # There is no 'update' method.
    # We're not supporting PUT requests because there aren't a lot of use cases
    # where the entire record needs to be replaced, PATCH suffices for updates.
    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

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
                group_count_by=serializer.validated_data['group_count_by'],
            )
        except (BadFilterFormat, FilterFieldNotFound) as e:
            raise ValidationError({'filters': e})
        except (BadSortFormat, SortFieldNotFound) as e:
            raise ValidationError({'order_by': e})
        except (BadGroupFormat, GroupFieldNotFound) as e:
            raise ValidationError({'group_count_by': e})

        serializer = RecordSerializer(records, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        record = table.get_record(pk)
        if not record:
            raise NotFound
        serializer = RecordSerializer(record)
        return Response(serializer.data)

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        # We only support adding a single record through the API.
        assert isinstance((request.data), dict)
        record = table.create_record_or_records(request.data)
        serializer = RecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        record = table.update_record(pk, request.data)
        serializer = RecordSerializer(record)
        return Response(serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        table.delete_record(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DatabaseKeyViewSet(viewsets.ViewSet):
    def list(self, request):
        return Response(get_non_default_database_keys())


class DatabaseViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    serializer_class = DatabaseSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = DatabaseFilter

    def get_queryset(self):
        return Database.objects.all().order_by('-created_at')

    @action(methods=['get'], detail=True)
    def types(self, request, pk=None):
        database = self.get_object()
        serializer = TypeSerializer(database.supported_types, many=True)
        return Response(serializer.data)


class DataFileViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin, CreateModelMixin):
    queryset = DataFile.objects.all().order_by('-created_at')
    serializer_class = DataFileSerializer
    pagination_class = DefaultLimitOffsetPagination

    def partial_update(self, request, pk=None):
        serializer = DataFileSerializer(
            data=request.data, context={'request': request}, partial=True
        )
        serializer.is_valid(raise_exception=True)

        data_file = self.get_object()
        if serializer.validated_data.get('header') is not None:
            data_file.header = serializer.validated_data['header']
            data_file.save()
            serializer = DataFileSerializer(data_file, context={'request': request})
            return Response(serializer.data)
        else:
            return Response(
                {'detail': 'Method "PATCH" allowed only for header.'},
                status=status.HTTP_405_METHOD_NOT_ALLOWED
            )

    def create(self, request):
        serializer = DataFileSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return create_datafile(request, serializer.validated_data)


class ConstraintViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    serializer_class = ConstraintSerializer
    pagination_class = DefaultLimitOffsetPagination

    def get_queryset(self):
        return Constraint.objects.filter(table__id=self.kwargs['table_pk']).order_by('-created_at')

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        serializer = ConstraintSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        # If we don't do this, the request.data QueryDict will only return the last column's name
        # if there are multiple columns.
        if type(request.data) != dict:
            data = request.data.dict()
            data['columns'] = request.data.getlist('columns')
        else:
            data = request.data
        try:
            name = data['name'] if 'name' in data else None
            constraint = table.add_constraint(data['type'], data['columns'], name)
        except ProgrammingError as e:
            if type(e.orig) == DuplicateTable:
                raise ValidationError(
                    'Relation with the same name already exists'
                )
            else:
                raise APIException(e)
        except IntegrityError as e:
            if type(e.orig) == UniqueViolation:
                raise ValidationError(
                    'This column has non-unique values so a unique constraint cannot be set'
                )
            else:
                raise APIException(e)

        out_serializer = ConstraintSerializer(constraint, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None, table_pk=None):
        constraint = self.get_object()
        try:
            constraint.drop()
        except ProgrammingError as e:
            if type(e.orig) == UndefinedObject:
                raise NotFound
            else:
                raise APIException(e)
        return Response(status=status.HTTP_204_NO_CONTENT)
