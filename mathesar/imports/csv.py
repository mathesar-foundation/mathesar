from io import TextIOWrapper
import tempfile

import clevercsv as csv

from db.constants import COLUMN_NAME_TEMPLATE
from db.encoding_utils import get_sql_compatible_encoding
from db.tables import prepare_table_for_import

from mathesar.errors import InvalidTableError
from mathesar.models.base import DataFile
from mathesar.imports.utils import process_column_names

# The user-facing documentation replicates these delimiter characters. If you
# c, process_column_nameshange this variable, please update the documentation as well.
ALLOWED_DELIMITERS = ",\t:|;"
SAMPLE_SIZE = 20000
CHECK_ROWS = 10


def import_csv(user, data_file_id, table_name, schema_oid, conn, comment=None):
    data_file = DataFile.objects.get(id=data_file_id, user=user)
    file_path = data_file.file.path
    header = data_file.header
    if table_name is None or table_name == '':
        table_name = data_file.base_name
    dialect = csv.dialect.SimpleDialect(
        data_file.delimiter,
        data_file.quotechar,
        data_file.escapechar
    )
    encoding = get_file_encoding(data_file.file)
    conversion_encoding, sql_encoding = get_sql_compatible_encoding(encoding)
    with open(file_path, 'rb') as csv_file:
        csv_reader = _get_sv_reader(csv_file, header, dialect)
        column_names = process_column_names(csv_reader.fieldnames)
    copy_sql, table_oid, db_table_name = prepare_table_for_import(
        table_name,
        schema_oid,
        column_names,
        header,
        conn,
        dialect.delimiter,
        dialect.escapechar,
        dialect.quotechar,
        sql_encoding,
        comment
    )
    _insert_csv_records(
        copy_sql,
        file_path,
        encoding,
        conversion_encoding,
        conn
    )
    return {"oid": table_oid, "name": db_table_name}


def _get_sv_reader(file, header, dialect=None):
    encoding = get_file_encoding(file)
    file = TextIOWrapper(file, encoding=encoding)
    if dialect:
        reader = csv.DictReader(file, dialect=dialect)
    else:
        reader = csv.DictReader(file)
    if not header:
        reader.fieldnames = [
            f"{COLUMN_NAME_TEMPLATE}{i}" for i in range(len(reader.fieldnames))
        ]
        file.seek(0)

    return reader


def _insert_csv_records(
    copy_sql,
    file_path,
    encoding,
    conversion_encoding,
    conn
):
    cursor = conn.cursor()
    with open(file_path, 'rb', encoding=encoding) as csv_file:
        if conversion_encoding == encoding:
            with cursor.copy(copy_sql) as copy:
                while data := csv_file.read():
                    copy.write(data)
        else:
            # File needs to be converted to compatible database supported encoding
            with tempfile.SpooledTemporaryFile(mode='wb+', encoding=conversion_encoding) as temp_file:
                while True:
                    contents = csv_file.read().encode(conversion_encoding, "replace")
                    if not contents:
                        break
                    temp_file.write(contents)
                temp_file.seek(0)
                with cursor.copy(copy_sql) as copy:
                    while data := temp_file.read():
                        copy.write(data)


def is_valid_csv(data):
    try:
        csv.reader(data)
    except (csv.CsvError, ValueError):
        return False
    return True


def get_file_encoding(file):
    """
    Given a file, uses charset_normalizer if installed or chardet which is installed as part of clevercsv module to
    detect the file encoding. Returns a default value of utf-8-sig if encoding could not be detected or detection
    libraries are missing.
    """
    from charset_normalizer import detect
    # Sample Size reduces the accuracy
    encoding = detect(file.read()).get('encoding', None)
    file.seek(0)
    if encoding is not None:
        return encoding
    return "utf-8"


def get_sv_dialect(file):
    """
    Given a *sv file, generate a dialect to parse it.

    Args:
        file: _io.TextIOWrapper object, an already opened file

    Returns:
        dialect: csv.Dialect object, the dialect to parse the file

    Raises:
        InvalidTableError: If the generated dialect was unable to parse the file
    """
    dialect = csv.detect.Detector().detect(file.read(SAMPLE_SIZE),
                                           delimiters=ALLOWED_DELIMITERS)
    if dialect is None:
        raise InvalidTableError

    file.seek(0)
    if _check_dialect(file, dialect):
        file.seek(0)
        return dialect
    else:
        raise InvalidTableError


def _check_dialect(file, dialect):
    """
    Checks to see if we can parse the given file with the given dialect

    Parses the first CHECK_ROWS rows. Checks to see if any have formatting issues (as
    indicated by parse_row), or if any have a differing number of columns.

    Args:
        file: _io.TextIOWrapper object, an already opened file
        dialect: csv.Dialect object, the dialect we are validating

    Returns:
        bool: False if any error that would cause SQL errors were found, otherwise True
    """
    prev_num_columns = None
    row_gen = csv.read.reader(file, dialect)
    for _ in range(CHECK_ROWS):
        try:
            row = next(row_gen)
        except StopIteration:
            # If less than CHECK_ROWS rows in file, stop early
            break

        num_columns = len(row)
        if prev_num_columns is None:
            prev_num_columns = num_columns
        elif prev_num_columns != num_columns:
            return False
    return True
