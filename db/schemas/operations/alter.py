from db.connection import execute_msar_func_with_engine

SUPPORTED_SCHEMA_ALTER_ARGS = {'name', 'description'}


def rename_schema(schema, engine, rename_to):
    """
    This method renames a Postgres schema.
    """
    if rename_to == schema:
        return
    execute_msar_func_with_engine(engine, 'rename_schema', schema, rename_to)


def comment_on_schema(schema, engine, comment):
    # Not using the DDLElement since the examples from the docs are
    # vulnerable to SQL injection attacks.
    execute_msar_func_with_engine(engine, 'comment_on_schema', schema, comment)


def alter_schema(name, engine, update_data):
    if "description" in update_data:
        comment_on_schema(name, engine, update_data["description"])
    if "name" in update_data:
        rename_schema(name, engine, update_data["name"])
