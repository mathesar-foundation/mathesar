from alembic.migration import MigrationContext
import json
import psycopg
from alembic.operations import Operations
from sqlalchemy import MetaData
from db.connection import execute_msar_func_with_engine
from db.columns.operations.select import get_column_names_from_attnums
from db.constraints.utils import get_constraint_type_from_char, ConstraintType, naming_convention
from db.tables.operations.select import reflect_table_from_oid
from db.metadata import get_empty_metadata


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
    # TODO reuse metadata
    metadata = get_empty_metadata()
    table = reflect_table_from_oid(table_oid, engine, metadata=metadata)
    constraint_type = get_constraint_type_from_char(constraint.contype)
    if constraint_type == ConstraintType.UNIQUE.value:
        column_attnums = constraint.conkey
        changed_column_attnums = [to_column_attnum if attnum == from_column_attnum else attnum for attnum in column_attnums]
        columns = get_column_names_from_attnums(table_oid, changed_column_attnums, engine, metadata=metadata)
        create_unique_constraint(table.name, table.schema, engine, columns)
    else:
        raise NotImplementedError

def test_d(engine):
    d = [{'con_name': 'uq_1', 'conntype': 'u', 'col_names': ['a', 'b']},
         {'con_name': 'uq_2', 'conntype': 'u', 'col_names': ['c']},
         {'conntype': 'p', 'col_names': ['a', 'c']},
         {'conntype': 'n', 'col_names': ['d', 'e']}]

    #x = execute_msar_func_with_engine(engine, 'add_constraints', 'test', 'public', json.dumps(d)).fetchone()
    conn_str = str(engine.url)
    with psycopg.connect(conn_str) as conn:
        # Returns a cursor
        x = conn.execute(
            f"SELECT msar.add_constraints('test', 'public', '{json.dumps(d)}'::jsonb)",
        ).fetchone()
    print(x)
    return x
