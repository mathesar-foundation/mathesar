from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from mathesar.serializers import TableSerializer
from mathesar.imports.csv import create_table_from_csv


def create_table_from_datafile(request, data):
    name = data['name']
    schema = data['schema']
    if len(data['data_files']) == 1:
        data_file = data['data_files'][0]
    else:
        raise ValidationError({'data_files': 'Multiple data files are unsupported'})

    table = create_table_from_csv(data_file, name, schema)
    serializer = TableSerializer(table, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
