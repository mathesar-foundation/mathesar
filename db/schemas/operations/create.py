from sqlalchemy.schema import CreateSchema

from db.schemas.utils import get_all_schemas


def create_schema(schema, engine):
    """
    This method creates a Postgres schema.
    """
    if schema not in get_all_schemas(engine):
        with engine.begin() as connection:
            connection.execute(CreateSchema(schema))
