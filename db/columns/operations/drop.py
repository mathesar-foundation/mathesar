from alembic.migration import MigrationContext
from alembic.operations import Operations

from db.columns.operations.select import get_column_name_from_attnum
from db.tables.operations.select import reflect_table_from_oid
from db.metadata import get_empty_metadata


def drop_column(table_oid, column_attnum, engine):
    # TODO reuse metadata
    metadata = get_empty_metadata()
    table = reflect_table_from_oid(table_oid, engine, metadata=metadata)
    column_name = get_column_name_from_attnum(table_oid, column_attnum, engine, metadata=metadata)
    column = table.columns[column_name]
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_column(table.name, column.name, schema=table.schema)
