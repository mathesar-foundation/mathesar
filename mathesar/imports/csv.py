from io import TextIOWrapper
import tempfile
import clevercsv as csv
from psycopg import sql

from db.tables.operations.alter import update_pk_sequence_to_latest
from mathesar.database.base import create_mathesar_engine
from db.records.operations.insert import insert_records_from_csv
from db.tables.operations.create import create_string_column_table, prepare_table_for_import
from db.tables.operations.drop import drop_table
from db.tables.operations.select import get_relation_name
from mathesar.errors import InvalidTableError
from mathesar.imports.utils import get_alternate_column_names, process_column_names
from db.constants import COLUMN_NAME_TEMPLATE
from psycopg2.errors import IntegrityError, DataError
from mathesar.models.base import DataFile
from db.encoding_utils import get_sql_compatible_encoding
from mathesar.state import reset_reflection

# The user-facing documentation replicates these delimiter characters. If you
# change this variable, please update the documentation as well.
ALLOWED_DELIMITERS = ",\t:|;"
SAMPLE_SIZE = 20000
CHECK_ROWS = 10


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


def insert_records_from_csv_data_file(name, schema, column_names, engine, comment, data_file):
    dialect = csv.dialect.SimpleDialect(data_file.delimiter, data_file.quotechar,
                                        data_file.escapechar)
    encoding = get_file_encoding(data_file.file)
    table = create_string_column_table(
        name=name,
        schema_oid=schema.oid,
        column_names=column_names,
        engine=engine,
        comment=comment,
    )
    insert_records_from_csv(
        table,
        engine,
        data_file.file.path,
        column_names,
        data_file.header,
        delimiter=dialect.delimiter,
        escape=dialect.escapechar,
        quote=dialect.quotechar,
        encoding=encoding
    )
    return table


def create_db_table_from_csv_data_file(data_file, name, schema, comment=None):
    db_model = schema.database
    engine = create_mathesar_engine(db_model)
    sv_filename = data_file.file.path
    header = data_file.header
    dialect = csv.dialect.SimpleDialect(data_file.delimiter, data_file.quotechar,
                                        data_file.escapechar)
    with open(sv_filename, 'rb') as sv_file:
        sv_reader = get_sv_reader(sv_file, header, dialect=dialect)
        column_names = process_column_names(sv_reader.fieldnames)
    try:
        table = insert_records_from_csv_data_file(name, schema, column_names, engine, comment, data_file)
        update_pk_sequence_to_latest(engine, table)
    except (IntegrityError, DataError):
        drop_table(name=name, schema=schema.name, engine=engine)
        column_names_alt = get_alternate_column_names(column_names)
        table = insert_records_from_csv_data_file(name, schema, column_names_alt, engine, comment, data_file)
    reset_reflection(db_name=db_model.name)
    return table


def insert_csv(data_file_id, table_name, schema_oid, conn, comment=None):
    data_file = DataFile.current_objects.get(id=data_file_id)
    file_path = data_file.file.path
    header = data_file.header
    dialect = csv.dialect.SimpleDialect(
        data_file.delimiter,
        data_file.quotechar,
        data_file.escapechar
    )
    encoding = get_file_encoding(data_file.file)
    with open(file_path, 'rb', encoding=encoding) as csv_file:
        csv_reader = get_sv_reader(csv_file, header, dialect)
        column_names = process_column_names(csv_reader.fieldnames)
        table_oid = prepare_table_for_import(
            table_name,
            schema_oid,
            column_names,
            conn,
            comment
        )
        insert_csv_records(
            table_oid,
            conn,
            csv_file,
            column_names,
            header,
            dialect.delimiter,
            dialect.escapechar,
            dialect.quotechar,
            encoding
        )


def insert_csv_records(
    table_oid,
    conn,
    csv_file,
    column_names,
    header,
    delimiter=None,
    escape=None,
    quote=None,
    encoding=None
):
    conversion_encoding, sql_encoding = get_sql_compatible_encoding(encoding)
    fq_table_name = sql.SQL(get_relation_name(table_oid, conn))
    formatted_columns = sql.SQL(",").join(
        sql.Identifier(column_name) for column_name in column_names
    )
    copy_sql = sql.SQL(
        f"COPY {fq_table_name} ({formatted_columns}) FROM STDIN CSV {header} {delimiter} {escape} {quote} {encoding}"
    ).format(
        fq_table_name=fq_table_name,
        formatted_columns=formatted_columns,
        header=sql.SQL("HEADER" if header else ""),
        delimiter=sql.SQL(f"DELIMITER E'{delimiter}'" if delimiter else ""),
        escape=sql.SQL(f"ESCAPE '{escape}'" if escape else ""),
        quote=sql.SQL(
            ("QUOTE ''''" if quote == "'" else f"QUOTE '{quote}'")
            if quote
            else ""
        ),
        encoding=sql.SQL(f"ENCODING '{sql_encoding}'" if sql_encoding else ""),
    )
    cursor = conn.connection.cursor()
    if conversion_encoding == encoding:
        with cursor.copy(copy_sql) as copy:
            if data := csv_file.read():
                copy.write(data)
    else:
        # File needs to be converted to compatible database supported encoding
        with tempfile.SpooledTemporaryFile(mode='wb+', encoding=conversion_encoding) as temp_file:
            while True:
                contents = csv_file.read(SAMPLE_SIZE).encode(conversion_encoding, "replace")
                if not contents:
                    break
                temp_file.write(contents)
            temp_file.seek(0)
            with cursor.copy(copy_sql) as copy:
                if data := temp_file.read():
                    copy.write(data)
