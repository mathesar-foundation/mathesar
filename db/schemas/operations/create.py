from sqlalchemy.schema import CreateSchema

from db.schemas.utils import get_all_schemas
from db.schemas.operations.alter import comment_on_schema


def create_schema(schema, engine, comment=None):
    """
    This method creates a Postgres schema.
    """
    if schema not in get_all_schemas(engine):
        with engine.begin() as connection:
            connection.execute(CreateSchema(schema))

        if comment is not None:
            comment_on_schema(schema, engine, comment)
