from rest_framework import viewsets
from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.parsers import MultiPartParser, JSONParser
from mathesar.api.serializers.bulk_insert import BulkInsertSerializer
from mathesar.api.serializers.data_files import DataFileSerializer
# from mathesar.api.viewsets.data_files import DataFileViewSet
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
        # print(request.data)
        serializer = BulkInsertSerializer(data=request.data, context={'request': request})
        # serializer.is_valid()
        print(serializer.validated_data)
        target_table_oid = serializer.validated_data['target_table_oid']
        mapping = serializer.validated_data['mappings']
        datafile = create_datafile(serializer.validated_data, user=request.user)
        with connect(serializer.validated_data['database_id'], request.user):
            pass
        # print(target_table_oid, mapping, datafile)
        pass
