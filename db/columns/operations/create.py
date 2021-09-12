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
from db.columns.operations.select import get_column_default, get_column_index_from_name
from db.columns.utils import get_mathesar_column_with_engine
from db.constraints.operations.create import copy_constraint
from db.constraints.operations.select import get_column_constraints
from db.constraints import utils as constraint_utils
from db.tables.operations.select import reflect_table_from_oid
from db.types.alteration import get_supported_alter_column_types


def create_column(engine, table_oid, column_data):
    column_type = column_data.get(TYPE, column_data.get("type"))
    column_type_options = column_data.get("type_options", {})
    column_nullable = column_data.get(NULLABLE, True)
    supported_types = get_supported_alter_column_types(
        engine, friendly_names=False,
    )
    sa_type = supported_types.get(column_type)
    if sa_type is None:
        # Requested type not supported. falling back to VARCHAR
        sa_type = supported_types["VARCHAR"]
        column_type_options = {}
    table = reflect_table_from_oid(table_oid, engine)

    try:
        column = MathesarColumn(
            column_data[NAME], sa_type(**column_type_options), nullable=column_nullable,
            server_default=column_data.get(DEFAULT, None)
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


def _duplicate_column_data(table_oid, from_column, to_column, engine):
    table = reflect_table_from_oid(table_oid, engine)
    copy = CopyColumn(
        table.schema,
        table.name,
        table.c[to_column].name,
        table.c[from_column].name
    )
    with engine.begin() as conn:
        conn.execute(copy)

    from_default = get_column_default(table_oid, from_column, engine)
    if from_default is not None:
        with engine.begin() as conn:
            set_column_default(table, to_column, engine, conn, from_default)


def _duplicate_column_constraints(table_oid, from_column, to_column, engine, copy_nullable=True):
    table = reflect_table_from_oid(table_oid, engine)
    if copy_nullable:
        with engine.begin() as conn:
            change_column_nullable(table, to_column, engine, conn, table.c[from_column].nullable)

    constraints = get_column_constraints(from_column, table_oid, engine)
    for constraint in constraints:
        constraint_type = constraint_utils.get_constraint_type_from_char(constraint.contype)
        if constraint_type != constraint_utils.ConstraintType.UNIQUE.value:
            # Don't allow duplication of primary keys
            continue
        copy_constraint(
            table, engine, constraint, from_column, to_column
        )


def duplicate_column(table_oid, copy_from_index, engine, new_column_name=None, copy_data=True, copy_constraints=True):
    table = reflect_table_from_oid(table_oid, engine)
    from_column = table.c[copy_from_index]
    if new_column_name is None:
        new_column_name = _gen_col_name(table, from_column.name)

    column_data = {
        NAME: new_column_name,
        "type": from_column.type.compile(dialect=engine.dialect),
        NULLABLE: True,
    }
    new_column = create_column(engine, table_oid, column_data)
    new_column_index = get_column_index_from_name(table_oid, new_column.name, engine)

    if copy_data:
        _duplicate_column_data(
            table_oid,
            copy_from_index,
            new_column_index,
            engine
        )

    if copy_constraints:
        _duplicate_column_constraints(
            table_oid,
            copy_from_index,
            new_column_index,
            engine,
            copy_nullable=copy_data
        )

    table = reflect_table_from_oid(table_oid, engine)
    column_index = get_column_index_from_name(table_oid, new_column_name, engine)
    return get_mathesar_column_with_engine(table.c[column_index], engine)
