from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from mathesar.models import DataFile, Schema
from mathesar.serializers import TableSerializer
from mathesar.imports.csv import create_table_from_csv
from mathesar.errors import InvalidDelimiterError


def create_table_from_datafile(request, data):
    name = data["name"]
    schema = Schema.objects.get(id=data["schema"])
    if len(data["data_files"]) == 1:
        data_file = DataFile.objects.get(id=data["data_files"][0])
    else:
        raise ValidationError({"data_files": "Multiple data files are unsupported"})

    try:
        table = create_table_from_csv(data_file, name, schema)
    except InvalidDelimiterError:
        raise ValidationError({"data_files": "No valid delimiter found in datafile"})

    serializer = TableSerializer(table, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
