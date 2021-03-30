import csv
from io import TextIOWrapper

from mathesar.database.base import human_readable_name, inspector
from mathesar.database.collections import DBCollection
from mathesar.models import Collection


def get_csv_reader(csv_file):
    csv_file = TextIOWrapper(csv_file, encoding="utf-8-sig")
    reader = csv.DictReader(csv_file)
    return reader


def create_collection_from_csv(csv_file):
    # TODO: Accept name as input from frontend.
    name = csv_file.name.lower()[:-4].title()
    csv_reader = get_csv_reader(csv_file)
    db_collection = DBCollection.create_from_csv(name, csv_reader)
    collection, _ = Collection.objects.get_or_create(
        name=human_readable_name(db_collection.name),
        schema=db_collection.schema
    )
    return collection
