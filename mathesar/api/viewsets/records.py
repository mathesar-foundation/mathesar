from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from sqlalchemy_filters.exceptions import BadFilterFormat, BadSortFormat, FilterFieldNotFound, SortFieldNotFound

from db.records import BadGroupFormat, GroupFieldNotFound
from mathesar.api.pagination import TableLimitOffsetGroupPagination
from mathesar.api.serializers.serializers import RecordListParameterSerializer, RecordSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.models import Table


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
