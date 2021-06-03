
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from mathesar.models import DataFile
from mathesar.serializers import TableSerializer
from mathesar.imports.csv import create_table_from_csv


def create_table_from_datafile(request):
    file_pk = request.data["data_file_pk"]
    try:
        data_file = DataFile.objects.get(id=file_pk)
    except DataFile.DoesNotExist:
        raise ValidationError(
            {"data_file_pk": "Data file not found"}
        )
    table = create_table_from_csv(data_file)
    serializer = TableSerializer(table, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
