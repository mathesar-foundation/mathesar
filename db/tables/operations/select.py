from sqlalchemy import Table, select, join

from db.connection import exec_msar_func
from db.deprecated.utils import execute_statement, get_pg_catalog_table

BASE = 'base'
DEPTH = 'depth'
JP_PATH = 'jp_path'
FK_PATH = 'fk_path'
REVERSE = 'reverse'
TARGET = 'target'
MULTIPLE_RESULTS = 'multiple_results'


def get_table(table, conn):
    """
    Return a dictionary describing a table of a schema.

    The `table` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    Args:
        table: The table for which we want table info.
    """
    return exec_msar_func(conn, 'get_table', table).fetchone()[0]


def get_table_info(schema, conn):
    """
    Return a list of dictionaries describing the tables of a schema.

    The `schema` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    Args:
        schema: The schema for which we want table info.
    """
    return exec_msar_func(conn, 'get_table_info', schema).fetchone()[0]


def list_joinable_tables(table_oid, conn, max_depth):
    return exec_msar_func(conn, 'get_joinable_tables', max_depth, table_oid).fetchone()[0]


def reflect_table(name, schema, engine, metadata, connection_to_use=None, keep_existing=False):
    extend_existing = not keep_existing
    autoload_with = engine if connection_to_use is None else connection_to_use
    return Table(
        name,
        metadata,
        schema=schema,
        autoload_with=autoload_with,
        extend_existing=extend_existing,
        keep_existing=keep_existing
    )


def reflect_table_from_oid(oid, engine, metadata, connection_to_use=None, keep_existing=False):
    tables = reflect_tables_from_oids(
        [oid],
        engine,
        metadata=metadata,
        connection_to_use=connection_to_use,
        keep_existing=keep_existing
    )
    return tables.get(oid, None)


def reflect_tables_from_oids(oids, engine, metadata, connection_to_use=None, keep_existing=False):
    oids_to_schema_and_table_names = (
        get_map_of_table_oid_to_schema_name_and_table_name(
            oids,
            engine,
            metadata=metadata,
            connection_to_use=connection_to_use,
        )
    )
    table_oids_to_sa_tables = {}
    for table_oid, (schema_name, table_name) in oids_to_schema_and_table_names.items():
        table_oids_to_sa_tables[table_oid] = reflect_table(
            table_name,
            schema_name,
            engine,
            metadata=metadata,
            connection_to_use=connection_to_use,
            keep_existing=keep_existing
        )
    return table_oids_to_sa_tables


def get_map_of_table_oid_to_schema_name_and_table_name(
        table_oids,
        engine,
        metadata,
        connection_to_use=None,
):
    if len(table_oids) == 0:
        return {}
    pg_class = get_pg_catalog_table("pg_class", engine, metadata=metadata)
    pg_namespace = get_pg_catalog_table("pg_namespace", engine, metadata=metadata)
    sel = (
        select(pg_namespace.c.nspname, pg_class.c.relname, pg_class.c.oid)
        .select_from(
            join(
                pg_class,
                pg_namespace,
                pg_class.c.relnamespace == pg_namespace.c.oid
            )
        )
        .where(pg_class.c.oid.in_(table_oids))
    )
    result_rows = execute_statement(engine, sel, connection_to_use).fetchall()
    table_oids_to_schema_names_and_table_names = {
        table_oid: (schema_name, table_name)
        for schema_name, table_name, table_oid
        in result_rows
    }
    return table_oids_to_schema_names_and_table_names
