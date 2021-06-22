from db.tables import get_table_oids_from_schema, infer_table_column_types
from db.types.inference import get_reverse_type_map
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
    types = infer_table_column_types(schema, table.name, schema._sa_engine)
    rev_type_map = get_reverse_type_map(schema._sa_engine)
    types = [rev_type_map[t] for t in types]
    return types
