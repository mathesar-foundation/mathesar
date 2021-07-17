import re

from mathesar.database.base import create_mathesar_engine
from mathesar.models import Table
from db import tables, records
from mathesar.errors import InvalidPasteError


def validate_paste(raw_paste):
    lines = raw_paste.split('\n')
    if len(lines) == 0:
        raise InvalidPasteError()

    # Assumes columns will be delimited by 2 or more whitespace characters
    # Tested with Google Sheets and Libre Office
    column_names = re.split(r'\s{2,}|\t', lines[0])
    num_columns = len(column_names)

    parsed_lines = []
    for line in lines[1:]:
        parsed_line = re.split(r'\s{2,}|\t', line)
        if len(parsed_line) != num_columns:
            raise InvalidPasteError
        parsed_lines.append(parsed_line)

    return column_names, parsed_lines


def create_db_table_from_paste(raw_paste, name, schema):
    engine = create_mathesar_engine(schema.database.name)
    column_names, lines = validate_paste(raw_paste)
    table = tables.create_string_column_table(
        name=name,
        schema=schema.name,
        column_names=column_names,
        engine=engine
    )
    records.create_records_from_paste(table, engine, lines, column_names)
    return table


def create_table_from_paste(raw_paste, name, schema):
    engine = create_mathesar_engine(schema.database.name)
    db_table = create_db_table_from_paste(raw_paste, name, schema)
    db_table_oid = tables.get_oid_from_table(db_table.name, db_table.schema, engine)
    table, _ = Table.objects.get_or_create(oid=db_table_oid, schema=schema)
    return table
