import csv
from io import TextIOWrapper

from mathesar.database.base import create_mathesar_engine
from mathesar.database.utils import get_database_key
from mathesar.models import Table, Schema
from db import tables, records


def get_sv_reader(file, delimiter=','):
    file = TextIOWrapper(file, encoding="utf-8-sig")
    reader = csv.DictReader(file, delimiter=delimiter)
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
    csv_reader = get_csv_reader(csv_file)
    db_table = legacy_create_db_table_from_csv(name, schema, csv_reader, engine)
    database = get_database_key(engine)
    schema, _ = Schema.objects.get_or_create(name=db_table.schema, database=database)
    table, _ = Table.objects.get_or_create(name=db_table.name, schema=schema)
    table.create_record_or_records([row for row in csv_reader])
    return table


def get_sv_delimiter(filename):
    if filename.endswith('.tsv'):
        return '\t'
    elif filename.endswith('.csv'):
        return ','
    else:
        # Should never be hit because we only allow csv and tsv extensions
        raise NotImplementedError("File extension not supported!")


def create_db_table_from_data_file(data_file, name, schema):
    engine = create_mathesar_engine(schema.database)
    sv_filename = data_file.file.path
    delimiter = get_sv_delimiter(sv_filename)
    with open(sv_filename, 'rb') as sv_file:
        sv_reader = get_sv_reader(sv_file, delimiter=delimiter)
        column_names = sv_reader.fieldnames
        table = tables.create_string_column_table(
            name=name,
            schema=schema.name,
            column_names=column_names,
            engine=engine
        )
    records.create_records_from_csv(table, engine, sv_filename, column_names,
                                    delimiter=delimiter)
    return table


def create_table_from_csv(data_file, name, schema):
    db_table = create_db_table_from_data_file(data_file, name, schema)
    table, _ = Table.objects.get_or_create(name=db_table.name, schema=schema)
    data_file.table_imported_to = table
    data_file.save()
    return table
