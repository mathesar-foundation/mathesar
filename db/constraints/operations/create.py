from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import MetaData

from db.columns.operations.select import get_columns_name_from_attnums
from db.constraints.utils import get_constraint_type_from_char, ConstraintType, naming_convention
from db.tables.operations.select import reflect_table_from_oid


def create_unique_constraint(table_name, schema, engine, columns, constraint_name=None):
    with engine.begin() as conn:
        metadata = MetaData(bind=engine, schema=schema, naming_convention=naming_convention)
        opts = {
            'target_metadata': metadata
        }
        ctx = MigrationContext.configure(conn, opts=opts)
        op = Operations(ctx)
        op.create_unique_constraint(constraint_name, table_name, columns, schema)


def create_constraint(schema, engine, constraint_obj):
    with engine.begin() as conn:
        constraint_obj.add_constraint(schema, engine, conn)


def copy_constraint(table_oid, engine, constraint, from_column_attnum, to_column_attnum):
    table = reflect_table_from_oid(table_oid, engine)
    constraint_type = get_constraint_type_from_char(constraint.contype)
    if constraint_type == ConstraintType.UNIQUE.value:
        column_attnums = constraint.conkey
        changed_column_attnums = [to_column_attnum if attnum == from_column_attnum else attnum for attnum in column_attnums]
        columns = get_columns_name_from_attnums([table_oid], changed_column_attnums, engine)
        create_unique_constraint(table.name, table.schema, engine, columns)
    else:
        raise NotImplementedError
