from sqlalchemy import select, and_, not_, or_, func

from db.constants import INTERNAL_SCHEMAS
from db.utils import get_pg_catalog_table
from db.metadata import get_empty_metadata
from db.connection import exec_msar_func


def list_schemas(conn):
    return exec_msar_func(conn, 'list_schemas').fetchone()[0]


def reflect_schema(engine, name=None, oid=None, metadata=None):
    # If we have both arguments, the behavior is undefined.
    try:
        assert name is None or oid is None
    except AssertionError as e:
        raise e
    # TODO reuse metadata
    metadata = metadata if metadata else get_empty_metadata()
    pg_namespace = get_pg_catalog_table("pg_namespace", engine, metadata=metadata)
    sel = (
        select(pg_namespace.c.oid, pg_namespace.c.nspname.label("name"))
        .where(or_(pg_namespace.c.nspname == name, pg_namespace.c.oid == oid))
    )
    with engine.begin() as conn:
        schema_info = conn.execute(sel).fetchone()
    return schema_info


def get_mathesar_schemas_with_oids(engine):
    # TODO reuse metadata
    metadata = get_empty_metadata()
    pg_namespace = get_pg_catalog_table("pg_namespace", engine, metadata=metadata)
    sel = (
        select(pg_namespace.c.nspname.label('schema'), pg_namespace.c.oid)
        .where(
            and_(
                *[pg_namespace.c.nspname != schema for schema in INTERNAL_SCHEMAS],
                pg_namespace.c.nspname != "information_schema",
                not_(pg_namespace.c.nspname.like("pg_%"))
            )
        )
    )
    with engine.begin() as conn:
        result = conn.execute(sel).fetchall()
    return result


def get_schema_description(oid, engine):
    with engine.begin() as conn:
        res = conn.execute(select(func.obj_description(oid, 'pg_namespace')))

    return res.fetchone()[0]
