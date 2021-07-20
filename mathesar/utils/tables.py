from db.tables import get_table_oids_from_schema, infer_table_column_types, create_mathesar_table, get_oid_from_table
from mathesar.database.base import create_mathesar_engine
from mathesar.models import Table


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
        col.name: t().compile(dialect=schema._sa_engine.dialect)
        for col, t in zip(table.sa_columns, types)
        if not col.is_default
        and not col.primary_key
        and not col.foreign_keys
    }
    return col_types


def create_empty_table(data):
    """
    Create an empty table, with only Mathesar's internal columns.

    :param data: the parsed and validated data from the incoming request
    :return: the newly created blank table
    """

    name = data['name']
    schema = data['schema']

    engine = create_mathesar_engine(schema.database.name)
    db_table = create_mathesar_table(name, schema.name, [], engine)
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table, _ = Table.objects.get_or_create(oid=db_table_oid, schema=schema)
    return table
