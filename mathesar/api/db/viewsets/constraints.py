from psycopg2.errors import UndefinedObject
from rest_framework import status, viewsets
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from sqlalchemy.exc import ProgrammingError

import mathesar.api.exceptions.database_exceptions.base_exceptions as base_database_api_exceptions
import mathesar.api.exceptions.generic_exceptions.base_exceptions as base_api_exceptions
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.constraints import ConstraintSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.models import Constraint


class ConstraintViewSet(ListModelMixin, RetrieveModelMixin, CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = ConstraintSerializer
    pagination_class = DefaultLimitOffsetPagination

    def get_queryset(self):
        return Constraint.objects.filter(table__id=self.kwargs['table_pk']).order_by('-created_at')

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        serializer = ConstraintSerializer(data=request.data, context={'request': request, 'table_id': table_pk})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            name = data['name'] if 'name' in data else None
            constraint = table.add_constraint(data['type'], data['columns'], name)
        except ProgrammingError as e:
            if type(e.orig) == DuplicateTable:
                raise database_api_exceptions.DuplicateTableAPIException(
                    e,
                    message='Relation with the same name already exists',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            else:
                raise base_api_exceptions.MathesarAPIException(e)
        except IntegrityError as e:
            if type(e.orig) == UniqueViolation:
                raise database_api_exceptions.UniqueViolationAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            else:
                raise base_api_exceptions.MathesarAPIException(e)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['table'] = get_table_or_404(self.kwargs['table_pk'])
        return context

    def destroy(self, request, pk=None, table_pk=None):
        constraint = self.get_object()
        try:
            constraint.drop()
        except ProgrammingError as e:
            if type(e.orig) == UndefinedObject:
                raise base_api_exceptions.NotFoundAPIException(e)
            else:
                raise base_database_api_exceptions.ProgrammingAPIException(e)
        return Response(status=status.HTTP_204_NO_CONTENT)
