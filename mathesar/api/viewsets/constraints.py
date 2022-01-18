from psycopg2.errors import DuplicateTable, UniqueViolation, UndefinedObject
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError, APIException
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from sqlalchemy.exc import ProgrammingError, IntegrityError

from mathesar.api.exceptions import exceptions
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.constraints import ConstraintSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.models import Constraint


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
        # Todo Check if the below can be replaced by serializer validated data
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
                raise exceptions.DuplicateTableException(e,
                                                         message='Relation with the same name already exists',
                                                         status_code=status.HTTP_400_BAD_REQUEST
                                                         )
            else:
                raise exceptions.CustomApiException(e)
        except IntegrityError as e:
            if type(e.orig) == UniqueViolation:
                raise exceptions.ApiUniqueViolation(e,
                                                    message='This column has non-unique values so a unique constraint cannot be set',
                                                    status_code=status.HTTP_400_BAD_REQUEST
                                                    )
            else:
                raise exceptions.CustomApiException(e)

        out_serializer = ConstraintSerializer(constraint, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None, table_pk=None):
        constraint = self.get_object()
        try:
            constraint.drop()
        except ProgrammingError as e:
            if type(e.orig) == UndefinedObject:
                raise NotFound()
            else:
                raise exceptions.ProgrammingException(e)
        return Response(status=status.HTTP_204_NO_CONTENT)
