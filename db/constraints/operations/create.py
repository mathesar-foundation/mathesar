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


def copy_constraint(_, engine, constraint, from_column_attnum, to_column_attnum):
    constraint_type = get_constraint_type_from_char(constraint.contype)
    if constraint_type == ConstraintType.UNIQUE.value:
        return execute_msar_func_with_engine(
            engine,
            'copy_constraint',
            constraint.oid,
            from_column_attnum,
            to_column_attnum
        ).fetchone()[0]
    else:
        raise NotImplementedError
