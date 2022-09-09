from alembic.migration import MigrationContext
from alembic.operations import Operations

from db.columns.operations.alter import batch_update_columns
from db.tables.operations.select import reflect_table
from db.metadata import get_empty_metadata

SUPPORTED_TABLE_ALTER_ARGS = {'name', 'columns'}


def rename_table(name, schema, engine, rename_to):
    # TODO reuse metadata
    table = reflect_table(name, schema, engine, metadata=get_empty_metadata())
    if rename_to == table.name:
        return
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.rename_table(table.name, rename_to, schema=table.schema)


def alter_table(table_name, table_oid, schema, engine, update_data):
    if 'name' in update_data and 'columns' in update_data:
        raise ValueError('Only name or columns can be passed in, not both.')
    if 'name' in update_data:
        rename_table(table_name, schema, engine, update_data['name'])
    if 'columns' in update_data:
        batch_update_columns(table_oid, engine, update_data['columns'])
