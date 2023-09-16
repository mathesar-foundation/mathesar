import os
import pandas
from time import time
from io import TextIOWrapper

import requests
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import TemporaryUploadedFile

from mathesar.api.exceptions.database_exceptions import (
    exceptions as database_api_exceptions
)
from mathesar.errors import URLDownloadError
from mathesar.imports.csv import is_valid_csv, get_sv_dialect, get_file_encoding
from mathesar.imports.json import is_valid_json, validate_json_format
from mathesar.models.base import DataFile


ALLOWED_FILE_FORMATS = ['csv', 'tsv', 'json', 'xls', 'xlsx', 'xlsm', 'xlsb', 'odf', 'ods', 'odt']


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


def _get_file_type(raw_file):
    """
    Algorithm:
    1.  Get file extension using 'os' library.
    2.  If the file extension is in ALLOWED_FILE_FORMATS then return file type
        as 'csv', 'tsv', 'json' or 'excel'.
    3.  If the file does not have an extension or does not have an allowed one,
        we check for the file type using brute force approach. Similar case can
        also arise when we download a file from an URL and it does not have a
        file type. We first try to read the file using 'csv' library. If it fails,
        we check if it is a valid JSON (using 'json' library) or a valid Excel like
        file (using 'pandas' library).
    4.  If it fails all the above operations, we raise UnsupportedFileFormat exception.
    """

    file_extension = os.path.splitext(raw_file.name)[1][1:]
    if file_extension in ALLOWED_FILE_FORMATS:
        if file_extension in ['csv', 'tsv', 'json']:
            return file_extension
        else:
            return 'excel'

    if is_valid_csv(raw_file):
        return 'csv'
    elif is_valid_json(raw_file):
        return 'json'
    else:
        try:
            pandas.read_excel(raw_file)
            return 'excel'
        except pandas.errors.ParserError:
            raise database_api_exceptions.UnsupportedFileFormat()


def create_datafile(data):
    header = data.get('header', True)

    # Validation guarentees only one arg will be present
    if 'paste' in data:
        type = 'json' if is_valid_json(data['paste']) else 'tsv'
        name = str(int(time())) + '.' + type
        raw_file = ContentFile(str.encode(data['paste']), name=name)
        created_from = 'paste'
        base_name = ''
    elif 'url' in data:
        raw_file = _download_datafile(data['url'])
        created_from = 'url'
        base_name = raw_file.name
        type = _get_file_type(raw_file)
    elif 'file' in data:
        raw_file = data['file']
        created_from = 'file'
        base_name = raw_file.name
        type = _get_file_type(raw_file)

    if base_name:
        max_length = DataFile._meta.get_field('base_name').max_length
        base_name, _ = os.path.splitext(os.path.basename(raw_file.name))
        base_name = base_name[:max_length]

    encoding = get_file_encoding(raw_file.file)
    text_file = TextIOWrapper(raw_file.file, encoding=encoding)
    if type == 'json':
        validate_json_format(raw_file)
    if type == 'csv' or type == 'tsv':
        dialect = get_sv_dialect(text_file)
        datafile = DataFile(
            file=raw_file,
            base_name=base_name,
            type=type,
            created_from=created_from,
            header=header,
            delimiter=dialect.delimiter,
            escapechar=dialect.escapechar,
            quotechar=dialect.quotechar,
        )
    else:
        max_level = data.get('max_level', 0)
        sheet_index = data.get('sheet_index', 0)
        datafile = DataFile(
            file=raw_file,
            base_name=base_name,
            type=type,
            created_from=created_from,
            header=header,
            max_level=max_level,
            sheet_index=sheet_index
        )
    datafile.save()
    raw_file.close()

    return datafile
