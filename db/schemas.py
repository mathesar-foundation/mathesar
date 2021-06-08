import logging
from sqlalchemy.schema import CreateSchema
from sqlalchemy import inspect, MetaData, select, and_, not_, or_, Table

from db import types

logger = logging.getLogger(__name__)

TYPES_SCHEMA = types.base.SCHEMA

EXCLUDED_SCHEMATA = [TYPES_SCHEMA, "information_schema"]


def get_schema_name_from_oid(oid, engine):
    return reflect_schema(engine, oid=oid)["name"]


def get_schema_oid_from_name(name, engine):
    return reflect_schema(engine, name=name)["oid"]


def reflect_schema(engine, name=None, oid=None):
    # If we have both arguments, the behavior is undefined.
    try:
        assert name is None or oid is None
    except Exception as e:
        logger.error("ERROR:  Only one of 'name' or 'oid' can be given!")
        raise e
    metadata = MetaData()
    pg_namespace = Table("pg_namespace", metadata, autoload_with=engine)
    sel = (
        select(pg_namespace.c.oid, pg_namespace.c.nspname.label("name"))
        .where(or_(pg_namespace.c.nspname == name, pg_namespace.c.oid == oid))
    )
    with engine.begin() as conn:
        schema_info = conn.execute(sel).fetchone()
    return schema_info


def get_mathesar_schemas(engine):
    return [schema for schema, _ in get_mathesar_schemas_with_oids(engine)]


def get_mathesar_schemas_with_oids(engine):
    metadata = MetaData()
    pg_namespace = Table("pg_namespace", metadata, autoload_with=engine)
    sel = (
        select(pg_namespace.c.nspname.label('schema'), pg_namespace.c.oid)
        .where(
            and_(
                *[pg_namespace.c.nspname != schema for schema in EXCLUDED_SCHEMATA],
                not_(pg_namespace.c.nspname.like("pg_%"))
            )
        )
    )
    with engine.begin() as conn:
        result = conn.execute(sel).fetchall()
    return result


def get_all_schemas(engine):
    inspector = inspect(engine)
    # We don't need to exclude system schemas (i.e., starting with "pg_")
    # since Inspector.get_schema_names already excludes them.  Thus, this
    # function actually gets all non-pg-reserved schemas.
    return inspector.get_schema_names()


def create_schema(schema, engine):
    """
    This method creates a Postgres schema.
    """
    if schema not in get_all_schemas(engine):
        with engine.begin() as connection:
            connection.execute(CreateSchema(schema))
