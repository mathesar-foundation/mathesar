from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class DefaultLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 500

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.count),
            ('results', data)
        ]))


class TableLimitOffsetPagination(DefaultLimitOffsetPagination):

    def paginate_queryset(self, queryset, request, table_id):
        self.limit = self.get_limit(request)
        if self.limit is None:
            self.limit = self.default_limit
        self.offset = self.get_offset(request)
        # TODO: Cache count value somewhere, since calculating it is expensive.
        table = queryset.get(id=table_id)
        self.count = table.sa_num_records
        self.request = request
        return table.get_records(self.limit, self.offset)
