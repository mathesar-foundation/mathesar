from sqlalchemy.schema import CreateSchema

from mathesar.database.base import engine, inspector


def get_all_schemas():
    return [
        schema
        for schema in inspector.get_schema_names()
        if schema not in ["public", "information_schema"]
    ]


def schema_exists(schema):
    return schema in get_all_schemas()


def create_schema(schema):
    """
    This method creates a Postgres schema corresponding to the application.
    """
    if not schema_exists(schema):
        with engine.begin() as connection:
            connection.execute(CreateSchema(schema))
