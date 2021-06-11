from io import TextIOWrapper

import clevercsv as csv

from mathesar.database.base import create_mathesar_engine
from mathesar.database.utils import get_database_key
from mathesar.models import Table, Schema
from mathesar.errors import InvalidDelimiterError
from db import tables, records

ALLOWED_DELIMITERS = ",\t:| "
SAMPLE_SIZE = 20000
CHECK_ROWS = 10


def parse_row(row, delimiter, escapechar, quotechar):
    in_quote = False
    escaped = False
    row_len = len(row)
    splits = []
    current_split = []
    i = 0
    while i < row_len:
        current_char = row[i]
        if current_char == quotechar and not escaped:
            if i != row_len - 1 and row[i + 1] == quotechar:
                # Handle double quote escapes
                current_split.append(current_char)
                i += 1
            else:
                in_quote = not in_quote
        elif current_char == escapechar and not escaped:
            escaped = True
        elif current_char == delimiter and not in_quote and not escaped:
            if current_split:
                # Multiple delimiter characters are handled as one
                splits.append(current_split)
            current_split = []
        else:
            current_split.append(current_char)
            escaped = False
        i += 1
    return splits


def check_dialect(file, dialect):
    prev_num_columns = None
    for _ in range(CHECK_ROWS):
        row = file.readline()[:-1]
        columns = parse_row(row, dialect.delimiter, dialect.escapechar,
                            dialect.quotechar)
        num_columns = len(columns)
        if num_columns == 0:
            return False

        if prev_num_columns is None:
            prev_num_columns = num_columns
        elif prev_num_columns != num_columns:
            return False
    return True


def get_sv_dialect(file):
    with open(file, 'r') as f:
        dialect = csv.Sniffer().sniff(f.read(SAMPLE_SIZE),
                                      delimiters=ALLOWED_DELIMITERS)
        f.seek(0)
        if check_dialect(f, dialect):
            return dialect
    raise InvalidDelimiterError


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
