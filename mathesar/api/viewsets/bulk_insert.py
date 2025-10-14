from rest_framework import viewsets
from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.parsers import MultiPartParser, JSONParser
from mathesar.api.serializers.bulk_insert import BulkInsertSerializer
# from mathesar.api.serializers.data_files import DataFileSerializer
# from mathesar.api.viewsets.data_files import DataFileViewSet
from mathesar.imports.datafile import copy_datafile_to_table
from mathesar.utils.datafiles import create_datafile
from mathesar.rpc.utils import connect
# from mathesar.models.base import DataFile, UserDatabaseRoleMap

"""
{
    "file": "http://localhost:8000/media/admin/type_inference.csv",
    "header": true,
    "target_table_oid": 12223,
    "mappings": []
}
"""


class BulkInsertViewSet(viewsets.GenericViewSet, ListModelMixin, CreateModelMixin):  # TODO: remove ListModelMixin
    serializer_class = BulkInsertSerializer
    parser_classes = [MultiPartParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = BulkInsertSerializer(data=request.data, context={'request': request})
        # print(serializer.validated_data)
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
            temp_table['oid']
            # insert_from_select()
        # print(target_table_oid, mapping, datafile)
        pass
