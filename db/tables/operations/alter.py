from db import constants
from db.connection import execute_msar_func_with_engine
from db.columns.operations.alter import batch_update_columns

SUPPORTED_TABLE_ALTER_ARGS = {'name', 'columns', 'description'}


def rename_table(name, schema, engine, rename_to):
    """
    Change a table's name, returning the command executed.

    Args:
        name:  original table name
        schema: schema where the table lives
        engine: SQLAlchemy engine object for connecting.
        rename_to:  new table name
    """
    if name == rename_to:
        result = None
    else:
        result = execute_msar_func_with_engine(
            engine, 'rename_table', schema, name, rename_to
        ).fetchone()[0]
    return result


def comment_on_table(name, schema, engine, comment):
    """
    Change the description of a table, returning command executed.

    Args:
        name: The name of the table whose comment we will change.
        schema: The schema of the table whose comment we will change.
        engine: SQLAlchemy engine object for connecting.
        comment: The new comment. Any quotes or special characters must
                 be escaped.
    """
    return execute_msar_func_with_engine(
        engine, 'comment_on_table', schema, name, comment
    ).fetchone()[0]


def alter_table(table_name, table_oid, schema, engine, update_data):
    if 'description' in update_data:
        comment_on_table(table_name, schema, engine, update_data['description'])
    if 'name' in update_data:
        rename_table(table_name, schema, engine, update_data['name'])
    if 'columns' in update_data:
        batch_update_columns(table_oid, engine, update_data['columns'])


def update_pk_sequence_to_latest(engine, table, connection=None):
    """
    Update the primary key sequence to the current maximum.

    This way, the next value inserted will use the next value in the
    sequence, avoiding collisions.

    Args:
        table_id: The OID of the table whose primary key sequence we'll
                  update.
        col_attnum: The attnum of the primary key column.
    """
    schema = table.schema or 'public'
    name = table.name
    column = table.c[constants.ID].name
    return execute_msar_func_with_engine(
        engine, 'update_pk_sequence_to_latest', schema, name, column
    ).fetchone()[0]
