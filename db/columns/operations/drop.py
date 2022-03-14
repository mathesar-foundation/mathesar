from alembic.migration import MigrationContext
from alembic.operations import Operations

from db.columns.operations.select import get_column_name_from_attnum
from db.tables.operations.select import reflect_table_from_oid


def drop_column(table_oid, column_attnum, engine):
    table = reflect_table_from_oid(table_oid, engine)
    column_name = get_column_name_from_attnum(table_oid, column_attnum, engine)
    column = table.columns[column_name]
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_column(table.name, column.name, schema=table.schema)
