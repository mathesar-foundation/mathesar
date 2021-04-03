import csv
from io import TextIOWrapper

from mathesar.database.tables import create_table, insert_rows_into_table
from mathesar.models import Collection


def get_csv_reader(csv_file):
    csv_file = TextIOWrapper(csv_file, encoding="utf-8-sig")
    reader = csv.DictReader(csv_file)
    return reader


def create_table_from_csv(name, csv_reader):
    table = create_table(name, name, csv_reader.fieldnames)
    insert_rows_into_table(table, [row for row in csv_reader])
    return table


def create_collection_from_csv(name, csv_file):
    csv_reader = get_csv_reader(csv_file)
    table = create_table_from_csv(name, csv_reader)
    collection, _ = Collection.objects.get_or_create(
        name=table.name, schema=table.schema
    )
    return collection
