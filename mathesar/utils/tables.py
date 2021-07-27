from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from db.tables import get_table_oids_from_schema, infer_table_column_types
from db.columns import MathesarColumn
from mathesar.models import Table
from mathesar.serializers import TableSerializer
from mathesar.imports.csv import create_table_from_csv
from mathesar.imports.paste import create_table_from_paste
from mathesar.errors import InvalidPasteError


def reflect_tables_from_schema(schema):
    db_table_oids = {
        table["oid"]
        for table in get_table_oids_from_schema(schema.oid, schema._sa_engine)
    }
    tables = [
        Table.objects.get_or_create(oid=oid, schema=schema)
        for oid in db_table_oids
    ]
    for table in Table.objects.all().filter(schema=schema):
        if table.oid not in db_table_oids:
            table.delete()
    return tables


def get_table_column_types(table):
    schema = table.schema
    types = infer_table_column_types(schema.name, table.name, schema._sa_engine)
    col_types = {
        col.name: t.__name__
        for col, t in zip(table.sa_columns, types)
        if not MathesarColumn.from_column(col).is_default
        and not col.primary_key
        and not col.foreign_keys
    }
    return col_types


def create_table_from_data(request, data):
    name = data['name']
    schema = data['schema']

    if data['data_files'] and data['paste']:
        raise ValidationError('Both data file and raw paste value supplied.')
    elif data['data_files']:
        table = create_table_from_datafile(data['data_files'], name, schema)
    elif data['paste']:
        table = create_table_from_paste_data(data['paste'], name, schema)
    else:
        raise ValidationError('No data files or paste value supplied.')

    serializer = TableSerializer(table, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


def create_table_from_datafile(data_files, name, schema):
    if len(data_files) == 1:
        data_file = data_files[0]
        table = create_table_from_csv(data_file, name, schema)
    elif len(data_files) > 1:
        raise ValidationError({'data_files': 'Multiple data files are unsupported.'})

    return table


def create_table_from_paste_data(paste, name, schema):
    try:
        table = create_table_from_paste(paste, name, schema)
    except InvalidPasteError:
        raise ValidationError({'paste': 'Unable to tabulate paste'})

    return table
