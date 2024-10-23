import psycopg
from sqlalchemy import Table
from db.schemas import get_schema
from db.tables import get_table


def reflect_table_from_oid(oid, engine, metadata, connection_to_use=None, keep_existing=False):
    with psycopg.connect(str(engine.url)) as conn:
        table_json = get_table(oid, conn)
        schema_name = get_schema(table_json["schema"], conn)["name"]
    extend_existing = not keep_existing
    autoload_with = engine if connection_to_use is None else connection_to_use
    return Table(
        table_json['name'],
        metadata,
        schema=schema_name,
        autoload_with=autoload_with,
        extend_existing=extend_existing,
        keep_existing=keep_existing

    )
