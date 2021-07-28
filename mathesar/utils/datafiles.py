from time import time
from io import TextIOWrapper

from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.core.files.base import ContentFile

from mathesar.serializers import DataFileSerializer
from mathesar.imports.csv import get_sv_dialect
from mathesar.errors import InvalidTableError


def create_datafile(request, data):
    header = data.get('header', True)

    if 'paste' in data and 'file' in data:
        raise ValidationError('Paste field and file field were both specified')
    if 'paste' in data:
        name = str(int(time())) + ".tsv"
        file = ContentFile(str.encode(data['paste']), name=name)
    elif 'file' in data:
        file = data['file']
    else:
        raise ValidationError('Paste field or file field must be specified')

    text_file = TextIOWrapper(file.file, encoding='utf-8-sig')
    try:
        dialect = get_sv_dialect(text_file)
    except InvalidTableError:
        raise ValidationError('Unable to tabulate data')

    inferred_data = {
        'file': file,
        'header': header,
        'delimiter': dialect.delimiter,
        'escapechar': dialect.escapechar,
        'quotechar': dialect.quotechar
    }
    serializer = DataFileSerializer(data=inferred_data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data, status=status.HTTP_201_CREATED)
