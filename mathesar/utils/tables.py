from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from mathesar.models import Table
from mathesar.errors import InvalidPasteError
from mathesar.serializers import TableSerializer
from mathesar.imports.csv import create_table_from_csv
from mathesar.database.base import create_mathesar_engine
from mathesar.imports.paste import create_table_from_paste
from db.tables import infer_table_column_types, create_mathesar_table, get_oid_from_table


def get_table_column_types(table):
    schema = table.schema
    types = infer_table_column_types(schema.name, table.name, schema._sa_engine)
    col_types = {
        col.name: t().compile(dialect=schema._sa_engine.dialect)
        for col, t in zip(table.sa_columns, types)
        if not col.is_default
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
        table = create_empty_table(name, schema)

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


def create_empty_table(name, schema):
    """
    Create an empty table, with only Mathesar's internal columns.

    :param name: the parsed and validated table name
    :param schema: the parsed and validated schema model
    :return: the newly created blank table
    """

    engine = create_mathesar_engine(schema.database.name)
    db_table = create_mathesar_table(name, schema.name, [], engine)
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table, _ = Table.objects.get_or_create(oid=db_table_oid, schema=schema)
    return table
