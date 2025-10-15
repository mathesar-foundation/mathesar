from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.mixins import CreateModelMixin
from rest_framework.parsers import MultiPartParser

from mathesar.api.serializers.bulk_insert import BulkInsertSerializer
from mathesar.api.exceptions.data_import_exceptions.exceptions import BulkImportException
from mathesar.imports.datafile import insert_into_existing_table
from mathesar.utils.datafiles import create_datafile
from mathesar.rpc.utils import connect


class BulkInsertViewSet(viewsets.GenericViewSet, CreateModelMixin):
    serializer_class = BulkInsertSerializer
    parser_classes = [MultiPartParser]

    def create(self, request, *args, **kwargs):
        serializer = BulkInsertSerializer(data=request.data, context={'request': request})
        serializer.is_valid()
        user = request.user
        data = serializer.validated_data
        database_id = data['database_id']
        target_table_oid = data['target_table_oid']
        mappings = data['mappings']

        try:
            datafile = create_datafile(data, user)
            with connect(database_id, user) as conn:
                inserted_rows = insert_into_existing_table(user, datafile.id, target_table_oid, mappings, conn)
                return Response({"inserted_rows": inserted_rows}, status=status.HTTP_200_OK)
        except Exception as e:
            raise BulkImportException(e)
