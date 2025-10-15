from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.mixins import CreateModelMixin
from rest_framework.parsers import MultiPartParser

from db.insert import insert_from_select
from mathesar.api.serializers.bulk_insert import BulkInsertSerializer
from mathesar.imports.datafile import copy_datafile_to_table
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
        header_to_validate = sorted([(i["csv_column"]["index"], i["csv_column"]["name"]) for i in mappings], key=lambda x: x[0])
        map = [
            {
                'temp_table_attnum': i["csv_column"]["index"],
                'target_table_attnum': i["table_column"]
            } for i in mappings if i["table_column"] is not None
        ]

        datafile = create_datafile(data, user)

        with connect(database_id, user) as conn:
            temp_table = copy_datafile_to_table(
                user,
                datafile.id,
                None,
                None,
                conn,
                comment=None,
                import_into_temp_table=True,
                header_to_validate=header_to_validate
            )
            inserted_rows = insert_from_select(conn, temp_table["oid"], target_table_oid, map)
            return Response({"inserted_rows": inserted_rows}, status=status.HTTP_200_OK)
