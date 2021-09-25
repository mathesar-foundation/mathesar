from alembic.migration import MigrationContext
from alembic.operations import Operations

from db.tables.operations.select import reflect_table_from_oid


def drop_column(table_oid, column_index, engine):
    column_index = int(column_index)
    table = reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_column(table.name, column.name, schema=table.schema)
