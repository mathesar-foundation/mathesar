from db.schemas.operations.alter import comment_on_schema
from db.connection import execute_msar_func_with_engine


def create_schema(schema_name, engine, comment=None, if_not_exists=False):
    """
    Creates a schema.

    Args:
        schema_name: Name of the schema to create.
        engine: SQLAlchemy engine object for connecting.
        comment: The new comment. Any quotes or special characters must
                 be escaped.
        if_not_exists: Whether to ignore an error if the schema does
                       exist.

    Returns:
        Returns a string giving the command that was run.
    """
    execute_msar_func_with_engine(engine, 'create_schema', schema_name, if_not_exists)
    if comment:
        comment_on_schema(schema_name, engine, comment)
