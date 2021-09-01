import logging
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError, APIException
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters import rest_framework as filters
from psycopg2.errors import (
    DuplicateColumn, DuplicateTable, UndefinedFunction, UniqueViolation, UndefinedObject
)
from sqlalchemy.exc import ProgrammingError, IntegrityError
from sqlalchemy_filters.exceptions import (
    BadFilterFormat, BadSortFormat, FilterFieldNotFound, SortFieldNotFound,
)

from db.records import BadGroupFormat, GroupFieldNotFound
from db.columns import InvalidDefaultError, InvalidTypeOptionError, InvalidTypeError

from mathesar.errors import InvalidTableError
from mathesar.models import Table, DataFile, Database, Constraint
from mathesar.api.pagination import (
    ColumnLimitOffsetPagination, DefaultLimitOffsetPagination, TableLimitOffsetGroupPagination
)
from mathesar.api.serializers import (
    RecordSerializer, DataFileSerializer,
    ColumnSerializer, DatabaseSerializer, ConstraintSerializer,
    RecordListParameterSerializer, TypeSerializer
)
from mathesar.api.utils import get_table_or_404
from mathesar.utils.datafiles import create_datafile
from mathesar.api.filters import DatabaseFilter

logger = logging.getLogger(__name__)


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

        if 'source_column' in serializer.validated_data:
            try:
                column = table.duplicate_column(
                    serializer.validated_data['source_column'],
                    serializer.validated_data['copy_source_data'],
                    serializer.validated_data['copy_source_constraints'],
                    serializer.validated_data.get('name'),
                )
            except IndexError:
                _col_idx = serializer.validated_data['source_column']
                raise ValidationError(f'column index "{_col_idx}" not found')
        else:
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
            except InvalidDefaultError:
                raise ValidationError(
                    f'default "{request.data["default"]}" is'
                    f' invalid for type {request.data["type"]}'
                )
            except InvalidTypeOptionError:
                type_options = request.data.get('type_options', '')
                raise ValidationError(
                    f'parameter dict {type_options} is'
                    f' invalid for type {request.data["type"]}'
                )
            except InvalidTypeError:
                raise ValidationError('This type casting is invalid.')

        out_serializer = ColumnSerializer(column)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        serializer = ColumnSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            column = table.alter_column(pk, serializer.validated_data)
        except ProgrammingError as e:
            if type(e.orig) == UndefinedFunction:
                raise ValidationError('This type cast is not implemented')
            else:
                raise ValidationError
        except IndexError:
            raise NotFound
        except TypeError:
            raise ValidationError("Unknown type_option passed")
        except InvalidDefaultError:
            raise ValidationError(
                f'default "{request.data["default"]}" is'
                f' invalid for this column'
            )
        except InvalidTypeOptionError:
            type_options = request.data.get('type_options', '')
            raise ValidationError(
                f'parameter dict {type_options} is'
                f' invalid for type {request.data["type"]}'
            )
        except InvalidTypeError:
            raise ValidationError('This type casting is invalid.')
        except Exception as e:
            raise APIException(e)
        out_serializer = ColumnSerializer(column)
        return Response(out_serializer.data)

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
        try:
            datafile = create_datafile(serializer.validated_data)
        except InvalidTableError:
            raise ValidationError('Unable to tabulate data')
        serializer = DataFileSerializer(datafile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
