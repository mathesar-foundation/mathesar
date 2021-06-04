from rest_framework import status
from rest_framework.response import Response

from mathesar.models import DataFile, Schema
from mathesar.serializers import TableSerializer
from mathesar.imports.csv import create_table_from_csv


def create_table_from_datafile(request, data):
    name = data["name"]
    schema = Schema.objects.get(id=data["schema"])
    data_file = DataFile.objects.get(id=data["data_file"])
    table = create_table_from_csv(data_file, name, schema)
    serializer = TableSerializer(table, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
