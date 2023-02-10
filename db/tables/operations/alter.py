from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import func, select, text

from db import constants
from db.columns.operations.alter import batch_update_columns
from db.tables.operations.select import reflect_table
from db.metadata import get_empty_metadata
from db.utils import execute_statement

SUPPORTED_TABLE_ALTER_ARGS = {'name', 'columns', 'description'}


def rename_table(name, schema, engine, rename_to):
    # TODO reuse metadata
    table = reflect_table(name, schema, engine, metadata=get_empty_metadata())
    if rename_to == table.name:
        return
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.rename_table(table.name, rename_to, schema=table.schema)


def comment_on_table(name, schema, engine, comment):
    # Not using the DDLElement since the examples from the docs are
    # vulnerable to SQL injection attacks.
    comment_command = text(f'COMMENT ON TABLE "{schema}"."{name}" IS :c')
    with engine.begin() as conn:
        conn.execute(comment_command, {'c': comment})


def alter_table(table_name, table_oid, schema, engine, update_data):
    if 'description' in update_data:
        comment_on_table(table_name, schema, engine, update_data['description'])
    if 'name' in update_data:
        rename_table(table_name, schema, engine, update_data['name'])
    if 'columns' in update_data:
        batch_update_columns(table_oid, engine, update_data['columns'])


def update_pk_sequence_to_latest(engine, table, connection=None):
    _preparer = engine.dialect.identifier_preparer
    quoted_table_name = _preparer.quote(table.schema) + "." + _preparer.quote(table.name)
    update_pk_sequence_stmt = func.setval(
        # `pg_get_serial_sequence needs a string of the Table name
        func.pg_get_serial_sequence(
            quoted_table_name,
            table.c[constants.ID].name
        ),
        # If the table can be empty, start from 1 instead of using Null
        func.coalesce(
            func.max(table.c[constants.ID]) + 1,
            1
        ),
        # Set the sequence to use the last value of the sequence
        # Setting is_called field to false, meaning that the next nextval will not advance the sequence before returning a value.
        # We need to do it as our default coalesce value is 1 instead of 0
        # Refer the postgres docs https://www.postgresql.org/docs/current/functions-sequence.html
        False
    )
    execute_statement(engine, select(update_pk_sequence_stmt), connection_to_use=connection)
