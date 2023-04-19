from db.schemas.operations.alter import comment_on_schema
from db.connection import execute_msar_func_with_engine


def create_schema(schema_name, engine, comment=None, if_not_exists=True):
    """
    This method creates a Postgres schema.
    """
    execute_msar_func_with_engine(engine, 'create_schema', schema_name, if_not_exists)
    if comment:
        comment_on_schema(schema_name, engine, comment)
