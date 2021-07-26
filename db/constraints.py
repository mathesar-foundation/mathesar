from alembic.migration import MigrationContext
from alembic.operations import Operations


def create_unique_constraint(table_name, schema, engine, columns):
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        constraint_name = '_'.join(['uq', table_name] + columns)
        op.create_unique_constraint(constraint_name, table_name, columns, schema)
