import os
from time import time
from io import TextIOWrapper

from django.core.files.base import ContentFile

from mathesar.utils.csv import is_valid_csv, get_file_encoding, get_sv_dialect
from mathesar.errors import UnsupportedFileFormat
from mathesar.models.base import DataFile


def create_datafile(data, user=None):
    header = data.get('header', True)

    # Validation guarentees only one arg will be present
    if 'paste' in data:
        name = str(int(time()))
        raw_file = ContentFile(str.encode(data['paste']), name=name)
        created_from = 'paste'
        base_name = ''
        type = _get_file_type(raw_file)
    elif 'file' in data:
        raw_file = data['file']
        created_from = 'file'
        base_name = raw_file.name
        type = _get_file_type(raw_file)
    else:
        raise Exception("No source submitted!")

    if base_name:
        max_length = DataFile._meta.get_field('base_name').max_length
        base_name, _ = os.path.splitext(os.path.basename(raw_file.name))
        base_name = base_name[:max_length]

    encoding = get_file_encoding(raw_file.file)
    text_file = TextIOWrapper(raw_file.file, encoding=encoding)
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
            user=user,
        )
        datafile.save()
        raw_file.close()
    else:
        raw_file.close()
        raise UnsupportedFileFormat

    return datafile


def _get_file_type(raw_file):
    file_extension = os.path.splitext(raw_file.name)[1][1:]
    if file_extension in ['csv', 'tsv']:
        return file_extension

    if is_valid_csv(raw_file):
        return 'csv'
