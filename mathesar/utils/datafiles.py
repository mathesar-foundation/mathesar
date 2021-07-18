from io import TextIOWrapper

from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from mathesar.serializers import DataFileSerializer
from mathesar.imports.csv import create_table_from_csv, get_sv_dialect
from mathesar.errors import InvalidTableError


def create_table_from_datafile(data):
    name = data['name']
    schema = data['schema']
    if len(data['data_files']) == 1:
        data_file = data['data_files'][0]
    else:
        raise ValidationError({'data_files': 'Multiple data files are unsupported'})

    table = create_table_from_csv(data_file, name, schema)
    return table


def create_datafile(request, original_file):
    text_file = TextIOWrapper(original_file.file, encoding="utf-8-sig")
    try:
        dialect = get_sv_dialect(text_file)
    except InvalidTableError:
        raise ValidationError({'file': 'Unable to tabulate datafile'})

    inferred_data = {'file': original_file,
                     'delimiter': dialect.delimiter,
                     'escapechar': dialect.escapechar,
                     'quotechar': dialect.quotechar}
    serializer = DataFileSerializer(data=inferred_data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        raise ValidationError(serializer.errors)
