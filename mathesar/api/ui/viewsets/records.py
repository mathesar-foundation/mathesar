import json
from psycopg2.errors import ForeignKeyViolation
from rest_access_policy import AccessViewSetMixin
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from sqlalchemy.exc import IntegrityError

from mathesar.api.ui.permissions.ui_records import RecordAccessPolicy
import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions

from mathesar.api.utils import get_table_or_404
from mathesar.models.base import Table

class RecordViewSet(AccessViewSetMixin, viewsets.GenericViewSet):
    access_policy = RecordAccessPolicy

    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

    @action(methods=['delete'], detail = False)
    def delete(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        pks = request.data.get("pks")
        try:
            table.bulk_delete_records(pks)
        except IntegrityError as e:
            if isinstance(e.orig, ForeignKeyViolation):
                raise database_api_exceptions.ForeignKeyViolationAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST,
                    referent_table=table,
                )

        return Response(status=status.HTTP_204_NO_CONTENT)