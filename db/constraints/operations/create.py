from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import MetaData

from db.constraints.utils import get_constraint_type_from_char, ConstraintType, naming_convention


def create_unique_constraint(table_name, schema, engine, columns, constraint_name=None):
    with engine.begin() as conn:
        metadata = MetaData(bind=engine, schema=schema, naming_convention=naming_convention)
        opts = {
            'target_metadata': metadata
        }
        ctx = MigrationContext.configure(conn, opts=opts)
        op = Operations(ctx)
        op.create_unique_constraint(constraint_name, table_name, columns, schema)


def copy_constraint(table, engine, constraint, from_column, to_column):
    constraint_type = get_constraint_type_from_char(constraint.contype)
    if constraint_type == ConstraintType.UNIQUE.value:
        column_idxs = [con - 1 for con in constraint.conkey]
        columns = [
            table.c[to_column if idx == from_column else idx].name
            for idx in column_idxs
        ]
        create_unique_constraint(table.name, table.schema, engine, columns)
    else:
        raise NotImplementedError
