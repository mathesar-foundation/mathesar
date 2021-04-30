import csv
from io import TextIOWrapper

from mathesar.database.base import create_mathesar_engine
from mathesar.database.utils import get_database_key
from mathesar.models import Table, Schema
from db import tables


def get_csv_reader(csv_file):
    csv_file = TextIOWrapper(csv_file, encoding="utf-8-sig")
    reader = csv.DictReader(csv_file)
    return reader


def create_db_table_from_csv(name, schema, csv_reader, engine):
    table = tables.create_string_column_table(
        name, schema, csv_reader.fieldnames, engine,
    )
    return table


def create_table_from_csv(name, schema, database_key, csv_file):
    engine = create_mathesar_engine(database_key)
    csv_reader = get_csv_reader(csv_file)
    db_table = create_db_table_from_csv(name, schema, csv_reader, engine)
    database = get_database_key(engine)
    schema, _ = Schema.objects.get_or_create(name=db_table.schema, database=database)
    table, _ = Table.objects.get_or_create(name=db_table.name, schema=schema)
    table.create_records([row for row in csv_reader])
    return table
