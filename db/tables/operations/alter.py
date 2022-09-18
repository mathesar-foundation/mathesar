from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import text

from db.columns.operations.alter import batch_update_columns
from db.tables.operations.select import reflect_table

SUPPORTED_TABLE_ALTER_ARGS = {'name', 'columns', 'description'}


def rename_table(name, schema, engine, rename_to):
    table = reflect_table(name, schema, engine)
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
