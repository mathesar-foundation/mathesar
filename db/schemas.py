from sqlalchemy.schema import CreateSchema
from sqlalchemy import inspect

from db import types

TYPES_SCHEMA = types.base.SCHEMA


def get_mathesar_schemas(engine):
    return [
        schema
        for schema in get_all_schemas(engine)
        if schema not in [TYPES_SCHEMA, "information_schema"]
    ]


def get_all_schemas(engine):
    inspector = inspect(engine)
    return inspector.get_schema_names()


def create_schema(schema, engine):
    """
    This method creates a Postgres schema.
    """
    if not schema in get_all_schemas(engine):
        with engine.begin() as connection:
            connection.execute(CreateSchema(schema))
