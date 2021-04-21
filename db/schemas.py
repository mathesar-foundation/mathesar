from sqlalchemy.schema import CreateSchema
from sqlalchemy import inspect


def get_all_schemas(engine):
    inspector = inspect(engine)
    return [
        schema
        for schema in inspector.get_schema_names()
        if schema not in ["public", "information_schema"]
    ]


def schema_exists(schema, engine):
    return schema in get_all_schemas(engine)


def create_schema(schema, engine):
    """
    This method creates a Postgres schema.
    """
    if not schema_exists(schema, engine):
        with engine.begin() as connection:
            connection.execute(CreateSchema(schema))
