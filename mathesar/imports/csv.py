from io import TextIOWrapper

import clevercsv as csv

from mathesar.database.base import create_mathesar_engine
from mathesar.models import Table
from db.records.operations.insert import insert_records_from_csv
from db.tables.operations.create import create_string_column_table
from db.tables.operations.select import get_oid_from_table
from db.tables.operations.drop import drop_table
from mathesar.errors import InvalidTableError
from db.constants import ID, ID_ORIGINAL, COLUMN_NAME_TEMPLATE
from psycopg2.errors import IntegrityError, DataError

from mathesar.reflection import reflect_columns_from_table

ALLOWED_DELIMITERS = ",\t:|"
SAMPLE_SIZE = 20000
CHECK_ROWS = 10


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


def check_dialect(file, dialect):
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
    if check_dialect(file, dialect):
        file.seek(0)
        return dialect
    else:
        raise InvalidTableError


def get_sv_reader(file, header, dialect=None):
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


def create_db_table_from_data_file(data_file, name, schema):
    engine = create_mathesar_engine(schema.database.name)
    sv_filename = data_file.file.path
    header = data_file.header
    dialect = csv.dialect.SimpleDialect(data_file.delimiter, data_file.quotechar,
                                        data_file.escapechar)
    encoding = get_file_encoding(data_file.file)
    with open(sv_filename, 'rb') as sv_file:
        sv_reader = get_sv_reader(sv_file, header, dialect=dialect)
        column_names = [column_name.strip() for column_name in sv_reader.fieldnames]
        column_names = [f"{COLUMN_NAME_TEMPLATE}{i}" if name == '' else name for i, name in enumerate(column_names)]
        column_names_alt = [fieldname if fieldname != ID else ID_ORIGINAL for fieldname in column_names]
        table = create_string_column_table(
            name=name,
            schema=schema.name,
            column_names=column_names,
            engine=engine
        )
    try:
        insert_records_from_csv(
            table,
            engine,
            sv_filename,
            column_names,
            header,
            delimiter=dialect.delimiter,
            escape=dialect.escapechar,
            quote=dialect.quotechar,
            encoding=encoding
        )
    except (IntegrityError, DataError):
        drop_table(name=name, schema=schema.name, engine=engine)
        table = create_string_column_table(
            name=name,
            schema=schema.name,
            column_names=column_names_alt,
            engine=engine
        )
        insert_records_from_csv(
            table,
            engine,
            sv_filename,
            column_names_alt,
            header,
            delimiter=dialect.delimiter,
            escape=dialect.escapechar,
            quote=dialect.quotechar,
            encoding=encoding
        )
    return table


def create_table_from_csv(data_file, name, schema):
    engine = create_mathesar_engine(schema.database.name)
    db_table = create_db_table_from_data_file(
        data_file, name, schema
    )
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    # Using current_objects to create the table instead of objects. objects
    # triggers re-reflection, which will cause a race condition to create the table
    table, _ = Table.current_objects.get_or_create(
        oid=db_table_oid,
        schema=schema,
        import_verified=False
    )
    reflect_columns_from_table(table)
    data_file.table_imported_to = table
    data_file.save()
    return table
