import warnings

from sqlalchemy import Table, MetaData, select, join, inspect, and_

from db.utils import execute_statement
from db.tables.utils import reflect_table


def reflect_table_from_oid(oid, engine, connection_to_use=None):
    metadata = MetaData()

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_class = Table("pg_class", metadata, autoload_with=engine)
        pg_namespace = Table("pg_namespace", metadata, autoload_with=engine)
    sel = (
        select(pg_namespace.c.nspname, pg_class.c.relname)
        .select_from(
            join(
                pg_class,
                pg_namespace,
                pg_class.c.relnamespace == pg_namespace.c.oid
            )
        )
        .where(pg_class.c.oid == oid)
    )
    result = execute_statement(engine, sel, connection_to_use)
    schema, table_name = result.fetchall()[0]
    return reflect_table(table_name, schema, engine, connection_to_use=connection_to_use)


def get_table_oids_from_schema(schema_oid, engine):
    metadata = MetaData()

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_class = Table("pg_class", metadata, autoload_with=engine)
    sel = (
        select(pg_class.c.oid)
        .where(
            and_(pg_class.c.relkind == 'r', pg_class.c.relnamespace == schema_oid)
        )
    )
    with engine.begin() as conn:
        table_oids = conn.execute(sel).fetchall()
    return table_oids


def get_oid_from_table(name, schema, engine):
    inspector = inspect(engine)
    return inspector.get_table_oid(name, schema=schema)
