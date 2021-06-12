from io import TextIOWrapper

import clevercsv as csv

from mathesar.database.base import create_mathesar_engine
from mathesar.database.utils import get_database_key
from mathesar.models import Table, Schema
from mathesar.errors import InvalidTableError
from db import tables, records

ALLOWED_DELIMITERS = ",\t:| "
SAMPLE_SIZE = 20000
CHECK_ROWS = 10


def parse_row(row, delimiter, escapechar, quotechar):
    """
    Parses a row of a *sv file given a set of dialetic parameters

    Tries to mimic how PostgreSQL parses CSV files:
        - Escape characters only escape quotes
        - Escape characters only work inside quotes
        - If no escape character is specified, it is the quote character

    Args:
        row: str, the row of text to parse
        delimiter: str, a single character that divides the fields of the row
        escapechar: str, a single character that escapes quotes
        quotechar: str, a single character that is the type of quote uses

    Returns:
        splits: None if the row was invalid (due to an unmatched quote), otherwise a
        list of lists, where the inner list contains every character of the field.

    """
    in_quote = False
    escaped = False
    row_len = len(row)
    splits = []
    current_split = []

    i = 0
    while i < row_len:
        current_char = row[i]
        if current_char == quotechar and not escaped:
            if (in_quote and not escapechar
                    and i != row_len - 1 and row[i + 1] == quotechar):
                # Handle double quote escapes when there is no escape char
                # Escapes are only respected within quotes
                current_split.append(current_char)
                i += 1
            else:
                in_quote = not in_quote
        elif current_char == escapechar and in_quote and not escaped:
            # Escapes are only respected within quotes
            escaped = True
        elif current_char == delimiter and not in_quote:
            splits.append(current_split)
            current_split = []
        else:
            current_split.append(current_char)
            escaped = False
        i += 1

    if in_quote:
        return None

    splits.append(current_split)
    return splits


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
    lines = iter(file)
    for _ in range(CHECK_ROWS):
        try:
            row = next(lines)[:-1]
        except StopIteration:
            # If less than CHECK_ROWS rows in file, stop early
            break

        columns = parse_row(row, dialect.delimiter, dialect.escapechar,
                            dialect.quotechar)
        if columns is None:
            return False
        else:
            num_columns = len(columns)

        if prev_num_columns is None:
            prev_num_columns = num_columns
        elif prev_num_columns != num_columns:
            return False
    return True


def get_sv_dialect(file):
    """
    Given a *sv file, generate a dialect to parse it.

    Args:
        file: str, path to the file

    Returns:
        dialect: csv.Dialect object, the dialect to parse the file

    Raises:
        InvalidTableError: If the generated dialect was unable to parse the file
    """
    with open(file, 'r') as f:
        dialect = csv.Sniffer().sniff(f.read(SAMPLE_SIZE),
                                      delimiters=ALLOWED_DELIMITERS)
        f.seek(0)
        if check_dialect(f, dialect):
            return dialect
        else:
            raise InvalidTableError


def get_sv_reader(file, dialect=None):
    file = TextIOWrapper(file, encoding="utf-8-sig")
    if dialect:
        reader = csv.DictReader(file, dialect=dialect)
    else:
        reader = csv.DictReader(file)
    return reader


# TODO: Remove this function once frontend switches to using the API
# See https://github.com/centerofci/mathesar/issues/150
def legacy_create_db_table_from_csv(name, schema, csv_reader, engine):
    table = tables.create_string_column_table(
        name, schema, csv_reader.fieldnames, engine,
    )
    return table


# TODO: Remove this function once frontend switches to using the API
# See https://github.com/centerofci/mathesar/issues/150
def legacy_create_table_from_csv(name, schema, database_key, csv_file):
    engine = create_mathesar_engine(database_key)
    csv_reader = get_sv_reader(csv_file)
    db_table = legacy_create_db_table_from_csv(name, schema, csv_reader, engine)
    database = get_database_key(engine)
    schema, _ = Schema.objects.get_or_create(name=db_table.schema, database=database)
    table, _ = Table.objects.get_or_create(name=db_table.name, schema=schema)
    table.create_record_or_records([row for row in csv_reader])
    return table


def create_db_table_from_data_file(data_file, name, schema):
    engine = create_mathesar_engine(schema.database)
    sv_filename = data_file.file.path
    dialect = get_sv_dialect(sv_filename)
    with open(sv_filename, 'rb') as sv_file:
        sv_reader = get_sv_reader(sv_file, dialect=dialect)
        column_names = sv_reader.fieldnames
        table = tables.create_string_column_table(
            name=name,
            schema=schema.name,
            column_names=column_names,
            engine=engine
        )
    records.create_records_from_csv(table, engine, sv_filename, column_names,
                                    delimiter=dialect.delimiter,
                                    escape=dialect.escapechar,
                                    quote=dialect.quotechar)
    return table


def create_table_from_csv(data_file, name, schema):
    db_table = create_db_table_from_data_file(data_file, name, schema)
    table, _ = Table.objects.get_or_create(name=db_table.name, schema=schema)
    data_file.table_imported_to = table
    data_file.save()
    return table
