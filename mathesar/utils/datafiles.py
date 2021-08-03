import os
from time import time
from io import TextIOWrapper

import requests
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import TemporaryUploadedFile

from mathesar.serializers import DataFileSerializer
from mathesar.imports.csv import get_sv_dialect
from mathesar.errors import InvalidTableError
from mathesar.models import DataFile


def _download_datafile(url):
    name = 'file_from_url'
    if '/' in url:
        name = url.split('/')[-1]

    with requests.get(url, allow_redirects=True, stream=True) as r:
        temp_file = TemporaryUploadedFile(
            name, r.headers.get('content-type'), r.headers.get('content-length'), None,
        )
        if not r.ok:
            raise ValidationError({'url': 'Unable to download datafile'})
        for chunk in r.iter_content(chunk_size=8192):
            temp_file.write(chunk)
    temp_file.seek(0)
    return temp_file


def create_datafile(request, data):
    header = data.get('header', True)

    # Validation guarentees only one arg will be present
    if 'paste' in data:
        name = str(int(time())) + '.tsv'
        file = ContentFile(str.encode(data['paste']), name=name)
        created_from = 'paste'
        base_name = ''
    elif 'url' in data:
        file = _download_datafile(data['url'])
        created_from = 'url'
        base_name = file.name
    elif 'file' in data:
        file = data['file']
        created_from = 'file'
        base_name = file.name

    if base_name:
        max_length = DataFile._meta.get_field('base_name').max_length
        base_name, _ = os.path.splitext(os.path.basename(file.name))
        base_name = base_name[:max_length]

    text_file = TextIOWrapper(file.file, encoding='utf-8-sig')
    try:
        dialect = get_sv_dialect(text_file)
    except InvalidTableError:
        raise ValidationError('Unable to tabulate data')

    datafile = DataFile(
        file=file,
        base_name=base_name,
        created_from=created_from,
        header=header,
        delimiter=dialect.delimiter,
        escapechar=dialect.escapechar,
        quotechar=dialect.quotechar,
    )
    datafile.save()
    file.close()

    serializer = DataFileSerializer(datafile, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
