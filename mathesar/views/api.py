import logging
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError, APIException
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.response import Response
from django.core.cache import cache
from rest_framework.decorators import action
from django_filters import rest_framework as filters
from psycopg2.errors import DuplicateColumn, UndefinedFunction
from sqlalchemy.exc import ProgrammingError
from sqlalchemy_filters.exceptions import (
    BadFilterFormat, BadSortFormat, FilterFieldNotFound, SortFieldNotFound,
)
from psycopg2.errors import DependentObjectsStillExist


from mathesar.database.utils import get_non_default_database_keys, update_databases
from mathesar.models import Table, Schema, DataFile, Database
from mathesar.pagination import (
    ColumnLimitOffsetPagination, DefaultLimitOffsetPagination, TableLimitOffsetGroupPagination
)
from mathesar.serializers import (
    TableSerializer, SchemaSerializer, RecordSerializer, DataFileSerializer, ColumnSerializer,
    TableDeleteParameterSerializer, DatabaseSerializer
)
from mathesar.utils.schemas import create_schema_and_object, reflect_schemas_from_database
from mathesar.utils.tables import reflect_tables_from_schema, get_table_column_types
from mathesar.utils.datafiles import create_table_from_datafile, create_datafile
from mathesar.filters import SchemaFilter, TableFilter, DatabaseFilter
from mathesar.forms import RecordListFilterForm

from db.records import BadGroupFormat, GroupFieldNotFound

logger = logging.getLogger(__name__)

DB_REFLECTION_KEY = 'database_reflected_recently'
DB_REFLECTION_INTERVAL = 60 * 5  # we reflect DB changes every 5 minutes


def reflect_db_objects():
    if not cache.get(DB_REFLECTION_KEY):
        update_databases()
        for database_key in get_non_default_database_keys():
            reflect_schemas_from_database(database_key)
        for schema in Schema.objects.all():
            reflect_tables_from_schema(schema)
        cache.set(DB_REFLECTION_KEY, True, DB_REFLECTION_INTERVAL)


class SchemaViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    def get_queryset(self):
        reflect_db_objects()
        return Schema.objects.all().order_by('-created_at')

    serializer_class = SchemaSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = SchemaFilter

    def create(self, request):
        serializer = SchemaSerializer(data=request.data)
        if serializer.is_valid():
            schema = create_schema_and_object(serializer.validated_data['name'],
                                              serializer.validated_data['database'])
            serializer = SchemaSerializer(schema)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            raise ValidationError(serializer.errors)


class TableViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    def get_queryset(self):
        reflect_db_objects()
        return Table.objects.all().order_by('-created_at')

    serializer_class = TableSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TableFilter

    def create(self, request):
        serializer = TableSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            return create_table_from_datafile(request, serializer.validated_data)
        else:
            raise ValidationError(serializer.errors)

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
        serializer = TableDeleteParameterSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)

        table = self.get_object()
        try:
            table.delete_sa_table(cascade=serializer.validated_data['cascade'])
        except DependentObjectsStillExist:
            raise ValidationError('Cannot delete, dependent database objects exist.')
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['get'], detail=True)
    def type_suggestions(self, request, pk=None):
        table = self.get_object()
        col_types = get_table_column_types(table)
        return Response(col_types)


class ColumnViewSet(viewsets.ViewSet):
    def get_queryset(self):
        reflect_db_objects()
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
        if serializer.is_valid():
            try:
                column = table.add_column(request.data)
            except ProgrammingError as e:
                if type(e.orig) == DuplicateColumn:
                    raise ValidationError(
                        f"Column {request.data['name']} already exists"
                    )
                else:
                    raise APIException(e)
        else:
            raise ValidationError(serializer.errors)
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
        reflect_db_objects()
        return Table.objects.all().order_by('-created_at')

    # For filter parameter formatting, see:
    # https://github.com/centerofci/sqlalchemy-filters#filters-format
    # For sorting parameter formatting, see:
    # https://github.com/centerofci/sqlalchemy-filters#sort-format
    def list(self, request, table_pk=None):
        paginator = TableLimitOffsetGroupPagination()

        # Use a Django Form to automatically parse JSON URL parameters
        filter_form = RecordListFilterForm(request.GET)
        if not filter_form.is_valid():
            raise ValidationError(filter_form.errors)

        try:
            records = paginator.paginate_queryset(
                self.get_queryset(), request, table_pk,
                filters=filter_form.cleaned_data['filters'],
                order_by=filter_form.cleaned_data['order_by'],
                group_count_by=filter_form.cleaned_data['group_count_by'],
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
        reflect_db_objects()
        return Database.objects.all().order_by('-created_at')
    serializer_class = DatabaseSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = DatabaseFilter


class DataFileViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin, CreateModelMixin):
    queryset = DataFile.objects.all().order_by('-created_at')
    serializer_class = DataFileSerializer
    pagination_class = DefaultLimitOffsetPagination

    def create(self, request):
        serializer = DataFileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            return create_datafile(request, serializer.validated_data['file'])
        else:
            raise ValidationError(serializer.errors)
