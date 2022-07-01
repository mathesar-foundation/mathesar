import os
from time import time
from io import TextIOWrapper

import requests
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import TemporaryUploadedFile

from mathesar.errors import URLDownloadError
from mathesar.imports.csv import get_sv_dialect, get_file_encoding
from mathesar.models.base import DataFile


def _download_datafile(url):
    name = 'file_from_url'
    if '/' in url:
        name = url.split('/')[-1]

    with requests.get(url, allow_redirects=True, stream=True) as r:
        temp_file = TemporaryUploadedFile(
            name, r.headers.get('content-type'), r.headers.get('content-length'), None,
        )
        if not r.ok:
            raise URLDownloadError
        for chunk in r.iter_content(chunk_size=8192):
            temp_file.write(chunk)
    temp_file.seek(0)
    return temp_file


def create_datafile(data):
    header = data.get('header', True)

    # Validation guarentees only one arg will be present
    if 'paste' in data:
        name = str(int(time())) + '.tsv'
        raw_file = ContentFile(str.encode(data['paste']), name=name)
        created_from = 'paste'
        base_name = ''
    elif 'url' in data:
        raw_file = _download_datafile(data['url'])
        created_from = 'url'
        base_name = raw_file.name
    elif 'file' in data:
        raw_file = data['file']
        created_from = 'file'
        base_name = raw_file.name

    if base_name:
        max_length = DataFile._meta.get_field('base_name').max_length
        base_name, _ = os.path.splitext(os.path.basename(raw_file.name))
        base_name = base_name[:max_length]

    encoding = get_file_encoding(raw_file.file)
    text_file = TextIOWrapper(raw_file.file, encoding=encoding)
    dialect = get_sv_dialect(text_file)

    datafile = DataFile(
        file=raw_file,
        base_name=base_name,
        created_from=created_from,
        header=header,
        delimiter=dialect.delimiter,
        escapechar=dialect.escapechar,
        quotechar=dialect.quotechar,
    )
    datafile.save()
    raw_file.close()

    return datafile
