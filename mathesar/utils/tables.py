from db.tables import get_table_oids_from_schema
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
    for table in Table.objects.all():
        if table.oid not in db_table_oids:
            table.delete()
    return tables
