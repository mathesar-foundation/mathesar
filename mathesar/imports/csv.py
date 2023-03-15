from io import TextIOWrapper
import hashlib

import clevercsv as csv

from db.tables.operations.alter import update_pk_sequence_to_latest
from mathesar.database.base import create_mathesar_engine
from mathesar.models.base import Table
from db.records.operations.insert import insert_records_from_csv
from db.tables.operations.create import create_string_column_table
from db.tables.operations.select import get_oid_from_table
from db.tables.operations.drop import drop_table
from mathesar.errors import InvalidTableError
from db.constants import ID, ID_ORIGINAL, COLUMN_NAME_TEMPLATE
from psycopg2.errors import IntegrityError, DataError

from mathesar.state import reset_reflection

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


def create_db_table_from_data_file(data_file, name, schema, comment=None):
    db_name = schema.database.name
    engine = create_mathesar_engine(db_name)
    sv_filename = data_file.file.path
    header = data_file.header
    dialect = csv.dialect.SimpleDialect(data_file.delimiter, data_file.quotechar,
                                        data_file.escapechar)
    encoding = get_file_encoding(data_file.file)
    with open(sv_filename, 'rb') as sv_file:
        sv_reader = get_sv_reader(sv_file, header, dialect=dialect)
        column_names = _process_column_names(sv_reader.fieldnames)
        table = create_string_column_table(
            name=name,
            schema=schema.name,
            column_names=column_names,
            engine=engine,
            comment=comment,
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
        update_pk_sequence_to_latest(engine, table)
    except (IntegrityError, DataError):
        drop_table(name=name, schema=schema.name, engine=engine)
        column_names_alt = [
            column_name if column_name != ID else ID_ORIGINAL
            for column_name in column_names
        ]
        table = create_string_column_table(
            name=name,
            schema=schema.name,
            column_names=column_names_alt,
            engine=engine,
            comment=comment,
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
    reset_reflection(db_name=db_name)
    return table


def _process_column_names(column_names):
    column_names = (
        column_name.strip()
        for column_name
        in column_names
    )
    column_names = (
        _truncate_if_necessary(column_name)
        for column_name
        in column_names
    )
    column_names = (
        f"{COLUMN_NAME_TEMPLATE}{i}" if name == '' else name
        for i, name
        in enumerate(column_names)
    )
    return list(column_names)


def _truncate_if_necessary(identifier):
    """
    Takes an identifier and returns it, truncating it, if it is too long. The truncated version
    will end with a hash of the passed identifier, therefore column name collision should be very
    rare.

    Iteratively removes characters from the end of the identifier, until the resulting string, with
    the suffix hash of the identifier appended, is short enough that it doesn't need to be truncated
    anymore. Whitespace is trimmed from the truncated identifier before appending the suffix.
    """
    assert type(identifier) is str
    if not _is_truncation_necessary(identifier):
        return identifier
    right_side = "-" + _get_truncation_hash(identifier)
    identifier_length = len(identifier)
    assert len(right_side) < identifier_length  # Sanity check
    range_of_num_of_chars_to_remove = range(1, identifier_length)
    for num_of_chars_to_remove in range_of_num_of_chars_to_remove:
        left_side = identifier[:num_of_chars_to_remove * -1]
        left_side = left_side.rstrip()
        truncated_identifier = left_side + right_side
        if not _is_truncation_necessary(truncated_identifier):
            return truncated_identifier
    raise Exception(
        "Acceptable truncation not found; should never happen."
    )


def _is_truncation_necessary(identifier):
    postgres_identifier_size_limit = 63
    size = _get_size_of_identifier_in_bytes(identifier)
    return size > postgres_identifier_size_limit


def _get_truncation_hash(identifier):
    """
    Produces an 8-character string hash of the passed identifier.

    Using hash function blake2s, because it seems fairly recommended and it seems to be better
    suited for shorter digests than blake2b. We want short digests to not take up too much of the
    truncated identifier in whose construction this will be used.
    """
    h = hashlib.blake2s(digest_size=4)
    bytes = _get_identifier_in_bytes(identifier)
    h.update(bytes)
    return h.hexdigest()


def _get_size_of_identifier_in_bytes(s):
    bytes = _get_identifier_in_bytes(s)
    return len(bytes)


def _get_identifier_in_bytes(s):
    """
    Afaict, following Postgres doc [0] says that UTF-8 supports all languages; therefore, different
    server locale configurations should not break this.

    [0] https://www.postgresql.org/docs/13/multibyte.html
    """
    return s.encode('utf-8')


def create_table_from_csv(data_file, name, schema, comment=None):
    engine = create_mathesar_engine(schema.database.name)
    db_table = create_db_table_from_data_file(
        data_file, name, schema, comment=comment
    )
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    # Using current_objects to create the table instead of objects. objects
    # triggers re-reflection, which will cause a race condition to create the table
    table = Table.current_objects.get(
        oid=db_table_oid,
        schema=schema,
    )
    table.import_verified = False
    table.save()
    data_file.table_imported_to = table
    data_file.save()
    return table
