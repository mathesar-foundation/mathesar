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
SAMPLE_SIZE = 1000000
CHECK_ROWS = 10


def import_csv(user, data_file_id, table_name, schema_oid, conn, comment=None):
    data_file = DataFile.objects.get(id=data_file_id, user=user)
    file_path = data_file.file.path
    header = data_file.header
    if table_name is None or table_name == '':
        table_name = data_file.base_name

    with open(file_path, "r", newline="") as f:
        dialect = csv.Sniffer().sniff(f.read(100000))
        f.seek(0)
        reader = csv.reader(f, dialect)
        if header:
            column_names = process_column_names(next(reader))
        else:
            column_names = [
                f"{COLUMN_NAME_TEMPLATE}{i}" for i in range(len(next(reader)))
            ]
    copy_sql, table_oid, db_table_name, renamed_columns = prepare_table_for_import(
        table_name,
        schema_oid,
        column_names,
        conn,
        comment
    )
    cursor = conn.cursor()
    with open(file_path, "r", newline="") as f, cursor.copy(copy_sql) as copy:
        reader = csv.reader(f, dialect)
        if header:
            column_names = next(reader)
        for row in reader:
            copy.write_row(row)

    return {"oid": table_oid, "name": db_table_name, "renamed_columns": renamed_columns}


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
