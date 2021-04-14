from sqlalchemy.schema import CreateSchema
from sqlalchemy import inspect

from mathesar.database.base import create_mathesar_engine

engine = create_mathesar_engine()


def get_all_schemas(engine=engine):
    inspector = inspect(engine)
    return [
        schema
        for schema in inspector.get_schema_names()
        if schema not in ["public", "information_schema"]
    ]


def schema_exists(schema, engine=engine):
    return schema in get_all_schemas(engine=engine)


def create_schema(schema, engine=engine):
    """
    This method creates a Postgres schema corresponding to the application.
    """
    inspector = inspect(engine)
    if not schema_exists(schema, engine=engine):
        with engine.begin() as connection:
            connection.execute(CreateSchema(schema))
