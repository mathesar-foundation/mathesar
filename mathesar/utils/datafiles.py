from io import TextIOWrapper

from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from mathesar.serializers import DataFileSerializer
from mathesar.imports.csv import get_sv_dialect
from mathesar.errors import InvalidTableError


def create_datafile(request, original_file, header):
    text_file = TextIOWrapper(original_file.file, encoding="utf-8-sig")
    try:
        dialect = get_sv_dialect(text_file)
    except InvalidTableError:
        raise ValidationError({'file': 'Unable to tabulate datafile'})

    inferred_data = {'file': original_file,
                     'header': header,
                     'delimiter': dialect.delimiter,
                     'escapechar': dialect.escapechar,
                     'quotechar': dialect.quotechar}
    serializer = DataFileSerializer(data=inferred_data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)
