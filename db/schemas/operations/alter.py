from db.connection import execute_msar_func_with_engine

SUPPORTED_SCHEMA_ALTER_ARGS = {'name', 'description'}


def rename_schema(schema_name, engine, rename_to):
    """
    Rename an existing schema.

    Args:
        schema_name: Name of the schema to change.
        engine: SQLAlchemy engine object for connecting.
        rename_to: New schema name.

    Returns:
        Returns a string giving the command that was run.
    """
    if rename_to == schema_name:
        return
    return execute_msar_func_with_engine(
        engine, 'rename_schema', schema_name, rename_to
    ).fetchone()[0]


def comment_on_schema(schema_name, engine, comment):
    """
    Change description of a schema.

    Args:
        schema_name: The name of the schema whose comment we will change.
        comment: The new comment.
        engine: SQLAlchemy engine object for connecting.

    Returns:
        Returns a string giving the command that was run.
    """
    return execute_msar_func_with_engine(
        engine, 'comment_on_schema', schema_name, comment
    ).fetchone()[0]


def alter_schema(name, engine, update_data):
    if "description" in update_data:
        comment_on_schema(name, engine, update_data["description"])
    if "name" in update_data:
        rename_schema(name, engine, update_data["name"])
