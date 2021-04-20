import csv
from io import TextIOWrapper

from mathesar.database.base import create_mathesar_engine
from mathesar.database.tables import create_table, insert_rows_into_table
from mathesar.models import Collection

engine = create_mathesar_engine()


def get_csv_reader(csv_file):
    csv_file = TextIOWrapper(csv_file, encoding="utf-8-sig")
    reader = csv.DictReader(csv_file)
    return reader


def create_table_from_csv(name, schema, csv_reader, engine):
    table = create_table(name, schema, csv_reader.fieldnames, engine)
    insert_rows_into_table(table, [row for row in csv_reader], engine)
    return table


def create_collection_from_csv(name, schema, csv_file, engine=engine):
    csv_reader = get_csv_reader(csv_file)
    table = create_table_from_csv(name, schema, csv_reader, engine)
    collection, _ = Collection.objects.get_or_create(
        name=table.name, schema=table.schema
    )
    return collection
