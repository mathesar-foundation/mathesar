from sqlalchemy import inspect

from db.schemas.operations.select import reflect_schema, get_mathesar_schemas_with_oids


def get_schema_name_from_oid(oid, engine):
    schema_info = reflect_schema(engine, oid=oid)
    if schema_info:
        return schema_info["name"]


def get_schema_oid_from_name(name, engine):
    schema_info = reflect_schema(engine, name=name)
    if schema_info:
        return schema_info["oid"]


def get_mathesar_schemas(engine):
    return [schema for schema, _ in get_mathesar_schemas_with_oids(engine)]


def get_all_schemas(engine):
    inspector = inspect(engine)
    # We don't need to exclude system schemas (i.e., starting with "pg_")
    # since Inspector.get_schema_names already excludes them.  Thus, this
    # function actually gets all non-pg-reserved schemas.
    return inspector.get_schema_names()
