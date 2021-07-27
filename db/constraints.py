from enum import Enum

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import MetaData


class ConstraintType(Enum):
    FOREIGN_KEY = 'foreignkey'
    PRIMARY_KEY = 'primary'
    UNIQUE = 'unique'
    CHECK = 'check'


# Naming conventions for constraints follow standard Postgres conventions
# described in https://stackoverflow.com/a/4108266
convention = {
    "ix": '%(table_name)s_%(column_0_name)s_idx',
    "uq": '%(table_name)s_%(column_0_name)s_key',
    "ck": '%(table_name)s_%(column_0_name)s_check',
    "fk": '%(table_name)s_%(column_0_name)s_fkey',
    "pk": '%(table_name)s_%(column_0_name)s_pkey'
}


def create_unique_constraint(table_name, schema, engine, columns, constraint_name=None):
    with engine.begin() as conn:
        metadata = MetaData(bind=engine, schema=schema, naming_convention=convention)
        opts = {
            'target_metadata': metadata
        }
        ctx = MigrationContext.configure(conn, opts=opts)
        op = Operations(ctx)
        op.create_unique_constraint(constraint_name, table_name, columns, schema)


def drop_constraint(table_name, schema, engine, constraint_name):
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_constraint(constraint_name, table_name, schema=schema)
