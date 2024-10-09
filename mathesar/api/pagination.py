from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class DefaultLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 500

    def get_paginated_response(self, data):
        return Response(
            OrderedDict(
                [
                    ('count', self.count),
                    ('results', data)
                ]
            )
        )
