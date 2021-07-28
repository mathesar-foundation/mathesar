import logging
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError, APIException
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters import rest_framework as filters
from psycopg2.errors import DuplicateColumn, UndefinedFunction
from sqlalchemy.exc import ProgrammingError
from sqlalchemy_filters.exceptions import (
    BadFilterFormat, BadSortFormat, FilterFieldNotFound, SortFieldNotFound,
)


from mathesar.database.utils import get_non_default_database_keys
from mathesar.models import Table, Schema, DataFile, Database
from mathesar.pagination import (
    ColumnLimitOffsetPagination, DefaultLimitOffsetPagination, TableLimitOffsetGroupPagination
)
from mathesar.serializers import (
    TableSerializer, SchemaSerializer, RecordSerializer, RecordListParameterSerializer,
    DataFileSerializer, ColumnSerializer, DatabaseSerializer
)
from mathesar.utils.schemas import create_schema_and_object
from mathesar.utils.tables import get_table_column_types, create_table_from_data
from mathesar.utils.datafiles import create_datafile
from mathesar.filters import SchemaFilter, TableFilter, DatabaseFilter

from db.records import BadGroupFormat, GroupFieldNotFound

logger = logging.getLogger(__name__)


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
        return create_table_from_data(request, serializer.validated_data)

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


class ColumnViewSet(viewsets.ViewSet):
    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

    def list(self, request, table_pk=None):
        paginator = ColumnLimitOffsetPagination()
        columns = paginator.paginate_queryset(self.get_queryset(), request, table_pk)
        serializer = ColumnSerializer(columns, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None, table_pk=None):
        table = Table.objects.get(id=table_pk)
        try:
            column = table.sa_columns[int(pk)]
        except IndexError:
            raise NotFound
        serializer = ColumnSerializer(column)
        return Response(serializer.data)

    def create(self, request, table_pk=None):
        table = Table.objects.get(id=table_pk)
        # We only support adding a single column through the API.
        serializer = ColumnSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            column = table.add_column(request.data)
        except ProgrammingError as e:
            if type(e.orig) == DuplicateColumn:
                raise ValidationError(
                    f"Column {request.data['name']} already exists"
                )
            else:
                raise APIException(e)

        out_serializer = ColumnSerializer(column)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        table = Table.objects.get(id=table_pk)
        assert isinstance((request.data), dict)
        try:
            column = table.alter_column(pk, request.data)
        except ProgrammingError as e:
            if type(e.orig) == UndefinedFunction:
                raise ValidationError("This type cast is not implemented")
            else:
                raise ValidationError
        except IndexError:
            raise NotFound
        serializer = ColumnSerializer(column)
        return Response(serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = Table.objects.get(id=table_pk)
        try:
            table.drop_column(pk)
        except IndexError:
            raise NotFound
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecordViewSet(viewsets.ViewSet):
    # There is no "update" method.
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
        table = Table.objects.get(id=table_pk)
        record = table.get_record(pk)
        if not record:
            raise NotFound
        serializer = RecordSerializer(record)
        return Response(serializer.data)

    def create(self, request, table_pk=None):
        table = Table.objects.get(id=table_pk)
        # We only support adding a single record through the API.
        assert isinstance((request.data), dict)
        record = table.create_record_or_records(request.data)
        serializer = RecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        table = Table.objects.get(id=table_pk)
        record = table.update_record(pk, request.data)
        serializer = RecordSerializer(record)
        return Response(serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = Table.objects.get(id=table_pk)
        table.delete_record(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DatabaseKeyViewSet(viewsets.ViewSet):
    def list(self, request):
        return Response(get_non_default_database_keys())


class DatabaseViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    def get_queryset(self):
        return Database.objects.all().order_by('-created_at')
    serializer_class = DatabaseSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = DatabaseFilter


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

        return create_datafile(
            request,
            serializer.validated_data['file'],
            serializer.validated_data.get('header', True),
        )
