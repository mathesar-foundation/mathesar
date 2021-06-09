import csv
from io import TextIOWrapper

from mathesar.database.base import create_mathesar_engine
from mathesar.database.utils import get_database_key
from mathesar.models import Table, Schema
from db import tables, records


def get_sv_dialect(filename):
    with open(filename, 'r') as f:
        dialect = csv.Sniffer().sniff(f.read())
    return dialect


def get_sv_reader(file, dialect=None):
    file = TextIOWrapper(file, encoding="utf-8-sig")
    reader = csv.DictReader(file, dialect=dialect)
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
