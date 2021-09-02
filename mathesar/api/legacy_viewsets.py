from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError, APIException
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from psycopg2.errors import DuplicateTable, UniqueViolation, UndefinedObject
from sqlalchemy.exc import ProgrammingError, IntegrityError
from sqlalchemy_filters.exceptions import (
    BadFilterFormat, BadSortFormat, FilterFieldNotFound, SortFieldNotFound,
)

from db.records import BadGroupFormat, GroupFieldNotFound

from mathesar.models import Table, Constraint
from mathesar.api.pagination import DefaultLimitOffsetPagination, TableLimitOffsetGroupPagination
from mathesar.api.serializers import RecordSerializer, ConstraintSerializer, RecordListParameterSerializer
from mathesar.api.utils import get_table_or_404


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
