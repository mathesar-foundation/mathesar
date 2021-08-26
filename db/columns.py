import logging
import warnings

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import (
    Column, Integer, ForeignKey, Table, MetaData, and_, select, inspect, text,
    DefaultClause, func
)
from sqlalchemy.ext import compiler
from sqlalchemy.exc import DataError, InternalError
from sqlalchemy.schema import DDLElement
from psycopg2.errors import InvalidTextRepresentation, InvalidParameterValue

from db import constants, tables, constraints
from db.types import alteration
from db.types.base import get_db_type_name
from db.utils import execute_statement

logger = logging.getLogger(__name__)


NAME = "name"
NULLABLE = "nullable"
PRIMARY_KEY = "primary_key"
TYPE = "sa_type"
DEFAULT = "default"

ID_TYPE = Integer
DEFAULT_COLUMNS = {
    constants.ID: {TYPE: ID_TYPE, PRIMARY_KEY: True, NULLABLE: False}
}


class InvalidDefaultError(Exception):
    pass


class InvalidTypeOptionError(Exception):
    pass


class InvalidTypeError(Exception):
    pass


class MathesarColumn(Column):
    """
    This class constrains the possible arguments, enabling us to include
    a copy method (which has been deprecated in upstream SQLAlchemy since
    1.4).  The idea is that we can faithfully copy the subset of the
    column definition that we care about, and this class defines that
    subset.
    """
    def __init__(
            self,
            name,
            sa_type,
            foreign_keys=set(),
            primary_key=False,
            nullable=True,
            server_default=None,
    ):
        """
        Construct a new ``MathesarColumn`` object.

        Required arguments:
        name -- String giving the name of the column in the database.
        sa_type -- the SQLAlchemy type of the column.

        Optional keyword arguments:
        primary_key -- Boolean giving whether the column is a primary key.
        nullable -- Boolean giving whether the column is nullable.
        server_default -- String or DefaultClause giving the default value
        """
        self.engine = None
        super().__init__(
            *foreign_keys,
            name=name,
            type_=sa_type,
            primary_key=primary_key,
            nullable=nullable,
            server_default=server_default
        )

    @classmethod
    def from_column(cls, column):
        """
        This alternate init method creates a new column (a copy) of the
        given column.  It respects only the properties in the __init__
        of the MathesarColumn.
        """
        fkeys = {ForeignKey(fk.target_fullname) for fk in column.foreign_keys}
        new_column = cls(
            column.name,
            column.type,
            foreign_keys=fkeys,
            primary_key=column.primary_key,
            nullable=column.nullable,
            server_default=column.server_default,
        )
        new_column.original_table = column.table
        return new_column

    @property
    def table_(self):
        """
        Returns the current table the column is associated with if it exists, otherwise
        returns the table the column was originally created from.
        """
        if hasattr(self, "table") and self.table is not None:
            return self.table
        elif hasattr(self, "original_table") and self.original_table is not None:
            return self.original_table
        return None

    @property
    def is_default(self):
        default_def = DEFAULT_COLUMNS.get(self.name, False)
        return (
            default_def
            and self.type.python_type == default_def[TYPE]().python_type
            and self.primary_key == default_def.get(PRIMARY_KEY, False)
            and self.nullable == default_def.get(NULLABLE, True)
        )

    def add_engine(self, engine):
        self.engine = engine

    @property
    def valid_target_types(self):
        """
        Returns a set of valid types to which the type of the column can be
        altered.
        """
        if self.engine is not None and not self.is_default:
            db_type = self.plain_type
            valid_target_types = sorted(
                list(
                    set(
                        alteration.get_full_cast_map(self.engine).get(db_type, [])
                    )
                )
            )
            return valid_target_types if valid_target_types else None

    @property
    def column_index(self):
        """
        Get the ordinal index of this column in its table, if it is
        attached to a table that is associated with the column's engine.
        """
        if (
                self.engine is not None
                and self.table_ is not None
                and inspect(self.engine).has_table(self.table_.name, schema=self.table_.schema)
        ):
            table_oid = tables.get_oid_from_table(
                self.table_.name, self.table_.schema, self.engine
            )
            return get_column_index_from_name(
                table_oid,
                self.name,
                self.engine
            )

    @property
    def default_value(self):
        if self.table_ is not None:
            table_oid = tables.get_oid_from_table(
                self.table_.name, self.table_.schema, self.engine
            )
            return get_column_default(table_oid, self.column_index, self.engine)

    @property
    def plain_type(self):
        """
        Get the type name without arguments
        """
        return self.type.__class__().compile(self.engine.dialect)

    @property
    def type_options(self):
        full_type_options = {
            "precision": getattr(self.type, "precision", None),
            "scale": getattr(self.type, "scale", None),
        }
        _type_options = {k: v for k, v in full_type_options.items() if v is not None}
        return _type_options if _type_options else None


def get_default_mathesar_column_list():
    return [
        MathesarColumn(
            col_name,
            **DEFAULT_COLUMNS[col_name]
        )
        for col_name in DEFAULT_COLUMNS
    ]


def init_mathesar_table_column_list_with_defaults(column_list):
    default_columns = get_default_mathesar_column_list()
    given_columns = [MathesarColumn.from_column(c) for c in column_list]
    return default_columns + given_columns


def get_column_index_from_name(table_oid, column_name, engine, connection_to_use=None):
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_attribute = Table("pg_attribute", MetaData(), autoload_with=engine)
    sel = select(pg_attribute.c.attnum).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attname == column_name
        )
    )
    result = execute_statement(engine, sel, connection_to_use).fetchone()[0]

    # Account for dropped columns that don't appear in the SQLAlchemy tables
    sel = (
        select(func.count())
        .where(and_(
            pg_attribute.c.attisdropped.is_(True),
            pg_attribute.c.attnum < result,
        ))
    )
    dropped_count = execute_statement(engine, sel, connection_to_use).fetchone()[0]

    return result - 1 - dropped_count


def create_column(engine, table_oid, column_data):
    column_type = column_data.get(TYPE, column_data.get("type"))
    column_type_options = column_data.get("type_options", {})
    column_nullable = column_data.get(NULLABLE, True)
    supported_types = alteration.get_supported_alter_column_types(
        engine, friendly_names=False,
    )
    sa_type = supported_types.get(column_type)
    if sa_type is None:
        logger.warning("Requested type not supported. falling back to VARCHAR")
        sa_type = supported_types["VARCHAR"]
        column_type_options = {}
    table = tables.reflect_table_from_oid(table_oid, engine)

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

    table = tables.reflect_table_from_oid(table_oid, engine)
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
        tables.reflect_table_from_oid(table_oid, engine).columns[column_data[NAME]],
        engine
    )


def alter_column(
        engine,
        table_oid,
        column_index,
        column_definition_dict,
):
    attribute_alter_map = {
        NAME: rename_column,
        TYPE: retype_column,
        "plain_type": retype_column,
        NULLABLE: change_column_nullable,
        "default_value": set_column_default
    }
    assert len(
        [key for key in column_definition_dict if key in attribute_alter_map]
    ) == 1
    column_def_key = list(column_definition_dict.keys())[0]
    column_index = int(column_index)
    return attribute_alter_map[column_def_key](
        table_oid,
        column_index,
        column_definition_dict[column_def_key],
        engine,
        type_options=column_definition_dict.get("type_options", {})
    )


def rename_column(table_oid, column_index, new_column_name, engine, **kwargs):
    table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.alter_column(
            table.name,
            column.name,
            new_column_name=new_column_name,
            schema=table.schema
        )
    return get_mathesar_column_with_engine(
        tables.reflect_table_from_oid(table_oid, engine).columns[column_index],
        engine
    )


def _handle_retype_data_errors(e):
    if type(e.orig) == InvalidParameterValue:
        raise InvalidTypeOptionError
    if type(e.orig) == InvalidTextRepresentation:
        raise InvalidTypeError
    else:
        raise e


def _check_type_option_equivalence(type_options_1, type_options_2):
    NULL_OPTIONS = [None, {}]
    if type_options_1 in NULL_OPTIONS and type_options_2 in NULL_OPTIONS:
        return True
    elif type_options_1 == type_options_2:
        return True
    return False


def retype_column(table_oid, column_index, new_type, engine, type_options={}, connection_to_use=None, table_to_use=None):
    table = table_to_use
    if table is None:
        table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    column_db_type = get_db_type_name(column.type, engine)
    column_type_options = MathesarColumn.from_column(column).type_options
    if (new_type == column_db_type) and _check_type_option_equivalence(type_options, column_type_options):
        return
    try:
        alteration.alter_column_type(
            table.schema,
            table.name,
            table.columns[column_index].name,
            new_type,
            engine,
            friendly_names=False,
            type_options=type_options,
            connection_to_use=connection_to_use,
            table_to_use=table_to_use
        )
    except DataError as e:
        _handle_retype_data_errors(e)
    except InternalError as e:
        raise e.orig

    if connection_to_use is None:
        return get_mathesar_column_with_engine(
            tables.reflect_table_from_oid(table_oid, engine).columns[column_index],
            engine
        )


def change_column_nullable(table_oid, column_index, nullable, engine, **kwargs):
    table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.alter_column(
            table.name,
            column.name,
            nullable=nullable,
            schema=table.schema
        )
    return get_mathesar_column_with_engine(
        tables.reflect_table_from_oid(table_oid, engine).columns[column_index],
        engine
    )


def get_mathesar_column_with_engine(col, engine):
    new_column = MathesarColumn.from_column(col)
    new_column.add_engine(engine)
    return new_column


def _validate_columns_for_batch_update(table, column_data):
    ALLOWED_KEYS = ['name', 'plain_type', 'type_options']
    if len(column_data) != len(table.columns):
        raise ValueError('Number of columns passed in must equal number of columns in table')
    for single_column_data in column_data:
        for key in single_column_data.keys():
            if key not in ALLOWED_KEYS:
                allowed_key_list = ', '.join(ALLOWED_KEYS)
                raise ValueError(f'Key "{key}" found in columns. Keys allowed are: {allowed_key_list}')


def _batch_update_column_types(table, column_data_list, connection, engine):
    table_oid = tables.get_oid_from_table(table.name, table.schema, engine)
    for index, column_data in enumerate(column_data_list):
        if 'plain_type' in column_data:
            new_type = column_data['plain_type']
            type_options = column_data.get('type_options', {})
            if type_options is None:
                type_options = {}
            retype_column(table_oid, index, new_type, engine, type_options, connection_to_use=connection, table_to_use=table)


def _batch_alter_table_columns(table, column_data_list, connection):
    ctx = MigrationContext.configure(connection)
    op = Operations(ctx)
    with op.batch_alter_table(table.name, schema=table.schema) as batch_op:
        for index, column_data in enumerate(column_data_list):
            column = table.columns[index]
            if 'name' in column_data and column.name != column_data['name']:
                batch_op.alter_column(
                    column.name,
                    new_column_name=column_data['name']
                )
            elif len(column_data.keys()) == 0:
                batch_op.drop_column(column.name)


def batch_update_columns(table_oid, engine, column_data_list):
    table = tables.reflect_table_from_oid(table_oid, engine)
    _validate_columns_for_batch_update(table, column_data_list)
    with engine.begin() as conn:
        _batch_update_column_types(table, column_data_list, conn, engine)
        _batch_alter_table_columns(table, column_data_list, conn)


def drop_column(table_oid, column_index, engine):
    column_index = int(column_index)
    table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_column(table.name, column.name, schema=table.schema)


def get_column_default(table_oid, column_index, engine, connection_to_use=None, table_to_use=None):
    table = table_to_use
    if table is None:
        table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    if column.server_default is None:
        return None

    metadata = MetaData()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_attribute = Table("pg_attribute", metadata, autoload_with=engine)
        pg_attrdef = Table("pg_attrdef", metadata, autoload_with=engine)

    query = (
        select(pg_attrdef.c.adbin)
        .select_from(
            pg_attrdef
            .join(
                pg_attribute,
                and_(
                    pg_attribute.c.attnum == pg_attrdef.c.adnum,
                    pg_attribute.c.attrelid == pg_attrdef.c.adrelid
                )
            )
        )
        .where(and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attname == column.name,
            pg_attribute.c.attnum >= 1,
        ))
    )

    result = execute_statement(engine, query, connection_to_use).first()[0]

    # Here, we get the 'adbin' value for the current column, stored in the attrdef
    # system table. The prefix of this value tells us whether the default is static
    # ('{CONSTANT') or generated ('{FUNCEXPR'). We do not return generated defaults.
    if result.startswith("{FUNCEXPR"):
        return None

    # Defaults are stored as text with SQL casts appended
    # Ex: "'test default string'::character varying" or "'2020-01-01'::date"
    # Here, we execute the cast to get the proper python value
    cast_sql_text = column.server_default.arg.text
    return execute_statement(engine, select(text(cast_sql_text)), connection_to_use).first()[0]


def _alter_column_default(ctx, table_name, column_name, schema, default_clause):
    op = Operations(ctx)
    op.alter_column(table_name, column_name, schema=schema, server_default=default_clause)


def set_column_default(table_oid, column_index, default, engine, connection_to_use=None,
                       table_to_use=None, **_):
    # Note: default should be textual SQL that produces the desired default
    if table_to_use is None:
        table = tables.reflect_table_from_oid(table_oid, engine)
    else:
        table = table_to_use
    column = table.columns[column_index]
    default_clause = DefaultClause(str(default)) if default is not None else default
    try:
        if connection_to_use is None:
            with engine.begin() as conn:
                ctx = MigrationContext.configure(conn)
                _alter_column_default(ctx, table.name, column.name, table.schema, default_clause)
        else:
            ctx = MigrationContext.configure(connection_to_use)
            _alter_column_default(ctx, table.name, column.name, table.schema, default_clause)
    except DataError as e:
        if (type(e.orig) == InvalidTextRepresentation):
            raise InvalidDefaultError
        else:
            raise e
    if connection_to_use is None:
        return get_mathesar_column_with_engine(
            tables.reflect_table_from_oid(table_oid, engine).columns[column_index],
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
def compile_create_table_as(element, compiler, **_):
    return 'UPDATE "%s"."%s" SET "%s" = "%s"' % (
        element.schema,
        element.table,
        element.to_column,
        element.from_column
    )


def duplicate_column_data(table_oid, from_column, to_column, engine):
    table = tables.reflect_table_from_oid(table_oid, engine)
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
        set_column_default(table_oid, to_column, from_default, engine)


def duplicate_column_constraints(table_oid, from_column, to_column, engine,
                                 copy_nullable=True):
    table = tables.reflect_table_from_oid(table_oid, engine)
    if copy_nullable:
        change_column_nullable(
            table_oid, to_column, table.c[from_column].nullable, engine
        )

    constraints_ = constraints.get_column_constraints(from_column, table_oid, engine)
    for constraint in constraints_:
        constraint_type = constraints.get_constraint_type_from_char(constraint.contype)
        if constraint_type != constraints.ConstraintType.UNIQUE.value:
            # Don't allow duplication of primary keys
            continue
        constraints.copy_constraint(
            table, engine, constraint, from_column, to_column
        )


def duplicate_column(
    table_oid, copy_from_index, engine,
    new_column_name=None, copy_data=True, copy_constraints=True
):
    table = tables.reflect_table_from_oid(table_oid, engine)
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
        duplicate_column_data(
            table_oid,
            copy_from_index,
            new_column_index,
            engine
        )

    if copy_constraints:
        duplicate_column_constraints(
            table_oid,
            copy_from_index,
            new_column_index,
            engine,
            copy_nullable=copy_data
        )

    table = tables.reflect_table_from_oid(table_oid, engine)
    column_index = get_column_index_from_name(table_oid, new_column_name, engine)
    return get_mathesar_column_with_engine(table.c[column_index], engine)
