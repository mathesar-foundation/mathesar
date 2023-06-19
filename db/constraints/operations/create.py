import json

from db.connection import execute_msar_func_with_engine
from db.constraints.utils import get_constraint_type_from_char, ConstraintType


def create_unique_constraint(table_name, schema, engine, columns, constraint_name=None):
    return execute_msar_func_with_engine(
        engine,
        'add_constraints',
        schema,
        table_name,
        json.dumps([{'name': constraint_name, 'type': 'u', 'columns': columns}])
    ).fetchone()[0]


def create_constraint(schema, engine, constraint_obj):
    with engine.begin() as conn:
        return constraint_obj.add_constraint(schema, engine, conn)


def copy_constraint(table_oid, engine, constraint, from_column_attnum, to_column_attnum):
    constraint_type = get_constraint_type_from_char(constraint.contype)
    if constraint_type == ConstraintType.UNIQUE.value:
        column_attnums = constraint.conkey
        changed_column_attnums = [
            to_column_attnum if attnum == from_column_attnum else attnum
            for attnum in column_attnums
        ]
        return execute_msar_func_with_engine(
            engine,
            'add_constraints',
            table_oid,
            json.dumps([{'type': 'u', 'columns': changed_column_attnums}])
        ).fetchone()[0]
    else:
        raise NotImplementedError
