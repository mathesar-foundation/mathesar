from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy.ext import compiler
from sqlalchemy.exc import DataError
from sqlalchemy.schema import DDLElement
from psycopg2.errors import InvalidTextRepresentation, InvalidParameterValue

from db.columns.base import MathesarColumn
from db.columns.defaults import DEFAULT, NAME, NULLABLE, TYPE
from db.columns.exceptions import InvalidDefaultError, InvalidTypeError, InvalidTypeOptionError
from db.columns.operations.alter import set_column_default, change_column_nullable
from db.columns.operations.select import (
    get_column_attnum_from_name, get_column_default, get_column_name_from_attnum,
)
from db.columns.utils import get_mathesar_column_with_engine
from db.constraints.operations.create import copy_constraint
from db.constraints.operations.select import get_column_constraints
from db.constraints import utils as constraint_utils
from db.tables.operations.select import reflect_table_from_oid
from db.types.base import PostgresType, get_db_type_enum_from_id, get_db_type_enum_from_class
from db import constants


def create_column(engine, table_oid, column_data):
    table = reflect_table_from_oid(table_oid, engine)
    column_name = column_data.get(NAME, '').strip()
    if column_name == '':
        column_data[NAME] = gen_col_name(table)
    column_type_id = column_data.get(TYPE, column_data.get("type"))
    column_type_options = column_data.get("type_options", {})
    column_nullable = column_data.get(NULLABLE, True)
    default_value = column_data.get(DEFAULT, {}).get('value')
    prepared_default_value = str(default_value) if default_value is not None else None
    column_type = get_db_type_enum_from_id(column_type_id)
    column_type_class = None
    if column_type is not None:
        column_type_class = column_type.get_sa_class(engine)
    if column_type_class is None:
        # Requested type unknown or not supported. Falling back to CHARACTER_VARYING
        column_type_class = PostgresType.CHARACTER_VARYING.get_sa_class(engine)
        column_type_options = {}
    table = reflect_table_from_oid(table_oid, engine)

    try:
        column = MathesarColumn(
            column_data[NAME], column_type_class(**column_type_options), nullable=column_nullable,
            server_default=prepared_default_value,
        )
    except DataError as e:
        if type(e.orig) == InvalidTextRepresentation:
            raise InvalidTypeError
        else:
            raise e

    table = reflect_table_from_oid(table_oid, engine)
    try:
        with engine.begin() as conn:
            ctx = MigrationContext.configure(conn)
            op = Operations(ctx)
            op.add_column(table.name, column, schema=table.schema)
    except DataError as e:
        if type(e.orig) == InvalidTextRepresentation:
            raise InvalidDefaultError
        elif type(e.orig) == InvalidParameterValue:
            raise InvalidTypeOptionError
        else:
            raise e

    return get_mathesar_column_with_engine(
        reflect_table_from_oid(table_oid, engine).columns[column_data[NAME]],
        engine
    )


def gen_col_name(table):
    base_name = constants.COLUMN_NAME_TEMPLATE
    col_num = len(table.c)
    name = f'{base_name}{col_num}'
    return name


def _gen_col_name(table, column_name):
    num = 1
    new_column_name = f"{column_name}_{num}"
    while new_column_name in table.c:
        num += 1
        new_column_name = f"{column_name}_{num}"
    return new_column_name


class CopyColumn(DDLElement):
    def __init__(self, schema, table, to_column, from_column):
        self.schema = schema
        self.table = table
        self.to_column = to_column
        self.from_column = from_column


@compiler.compiles(CopyColumn, "postgresql")
def compile_copy_column(element, compiler, **_):
    return 'UPDATE "%s"."%s" SET "%s" = "%s"' % (
        element.schema,
        element.table,
        element.to_column,
        element.from_column
    )


def _duplicate_column_data(table_oid, from_column_attnum, to_column_attnum, engine):
    table = reflect_table_from_oid(table_oid, engine)
    from_column_name = get_column_name_from_attnum(table_oid, from_column_attnum, engine)
    to_column_name = get_column_name_from_attnum(table_oid, to_column_attnum, engine)
    copy = CopyColumn(
        table.schema,
        table.name,
        to_column_name,
        from_column_name,
    )
    with engine.begin() as conn:
        conn.execute(copy)
    from_default = get_column_default(table_oid, from_column_attnum, engine)
    if from_default is not None:
        with engine.begin() as conn:
            set_column_default(table_oid, to_column_attnum, engine, conn, from_default)


def _duplicate_column_constraints(table_oid, from_column_attnum, to_column_attnum, engine, copy_nullable=True):
    table = reflect_table_from_oid(table_oid, engine)
    from_column_name = get_column_name_from_attnum(table_oid, from_column_attnum, engine)
    if copy_nullable:
        with engine.begin() as conn:
            change_column_nullable(table_oid, to_column_attnum, engine, conn, table.c[from_column_name].nullable)
    constraints = get_column_constraints(from_column_attnum, table_oid, engine)
    for constraint in constraints:
        constraint_type = constraint_utils.get_constraint_type_from_char(constraint.contype)
        if constraint_type != constraint_utils.ConstraintType.UNIQUE.value:
            # Don't allow duplication of primary keys
            continue
        copy_constraint(
            table_oid, engine, constraint, from_column_attnum, to_column_attnum
        )


def duplicate_column(table_oid, copy_from_attnum, engine, new_column_name=None, copy_data=True, copy_constraints=True):
    table = reflect_table_from_oid(table_oid, engine)
    copy_from_name = get_column_name_from_attnum(table_oid, copy_from_attnum, engine)
    from_column = MathesarColumn.from_column(table.c[copy_from_name])
    from_column_db_type = get_db_type_enum_from_class(
        from_column.type.__class__,
        engine,
    )
    if new_column_name is None:
        new_column_name = _gen_col_name(table, from_column.name)

    column_data = {
        NAME: new_column_name,
        "type": from_column_db_type.id,
        NULLABLE: True,
    }
    new_column = create_column(engine, table_oid, column_data)
    new_column_attnum = get_column_attnum_from_name(table_oid, new_column.name, engine)
    if copy_data:
        _duplicate_column_data(
            table_oid,
            copy_from_attnum,
            new_column_attnum,
            engine
        )

    if copy_constraints:
        _duplicate_column_constraints(
            table_oid,
            copy_from_attnum,
            new_column_attnum,
            engine,
            copy_nullable=copy_data
        )

    table = reflect_table_from_oid(table_oid, engine)
    column_name = get_column_name_from_attnum(table_oid, new_column_attnum, engine)
    return get_mathesar_column_with_engine(table.c[column_name], engine)
