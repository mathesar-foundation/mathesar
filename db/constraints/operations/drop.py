from alembic.migration import MigrationContext
from alembic.operations import Operations


def drop_constraint(table_name, schema, engine, constraint_name):
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_constraint(constraint_name, table_name, schema=schema)
