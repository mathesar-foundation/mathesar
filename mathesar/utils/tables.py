from rest_framework.exceptions import ValidationError

from db.tables import (
    get_table_oids_from_schema, infer_table_column_types, update_table,
    SUPPORTED_TABLE_UPDATE_ARGS
)
from db.columns import MathesarColumn
import mathesar.models as models


def reflect_tables_from_schema(schema):
    db_table_oids = {
        table["oid"]
        for table in get_table_oids_from_schema(schema.oid, schema._sa_engine)
    }
    tables = [
        models.Table.objects.get_or_create(oid=oid, schema=schema)
        for oid in db_table_oids
    ]
    for table in models.Table.objects.all().filter(schema=schema):
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


def update_sa_table(table, validated_data):
    for arg in validated_data:
        if arg not in SUPPORTED_TABLE_UPDATE_ARGS:
            raise ValidationError({arg: f'Updating {arg} for tables is not supported.'})
    update_table(table.name, table.schema.name, table.schema._sa_engine, validated_data)
