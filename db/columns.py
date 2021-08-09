import logging
import warnings
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import (
    Column, Integer, ForeignKey, Table, MetaData, and_, select, inspect, text,
    DefaultClause, func
)
from db import constants, tables
from db.types import alteration

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
        return cls(
            column.name,
            column.type,
            foreign_keys=fkeys,
            primary_key=column.primary_key,
            nullable=column.nullable,
            server_default=column.server_default
        )

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
            db_type = self.type.compile(dialect=self.engine.dialect)
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
                and self.table is not None
                and inspect(self.engine).has_table(self.table.name, schema=self.table.schema)
        ):
            table_oid = tables.get_oid_from_table(
                self.table.name, self.table.schema, self.engine
            )
            return get_column_index_from_name(
                table_oid,
                self.name,
                self.engine
            )

    @property
    def default_value(self):
        return _decode_server_default(self.server_default, self.engine)


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


def get_column_index_from_name(table_oid, column_name, engine):
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_attribute = Table("pg_attribute", MetaData(), autoload_with=engine)
    sel = select(pg_attribute.c.attnum).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attname == column_name
        )
    )
    with engine.begin() as conn:
        result = conn.execute(sel).fetchone()[0]

    # Account for dropped columns that don't appear in the SQLAlchemy tables
    sel = (
        select(func.count())
        .where(and_(
            pg_attribute.c.attisdropped.is_(True),
            pg_attribute.c.attnum < result,
        ))
    )
    with engine.begin() as conn:
        dropped_count = conn.execute(sel).fetchone()[0]

    return result - 1 - dropped_count


def create_column(engine, table_oid, column_data):
    column_nullable = column_data.get(NULLABLE, True)

    column_type = column_data.get(TYPE, column_data["type"])
    supported_types = alteration.get_supported_alter_column_types(
        engine, friendly_names=False,
    )
    sa_type = supported_types.get(column_type)
    if sa_type is None:
        logger.warning("Requested type not supported. falling back to VARCHAR")
        sa_type = supported_types["VARCHAR"]

    default = column_data.get(DEFAULT, None)
    default_clause = DefaultClause(default) if default is not None else default

    column = MathesarColumn(
        column_data[NAME], sa_type, nullable=column_nullable,
        server_default=default_clause
    )

    table = tables.reflect_table_from_oid(table_oid, engine)
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.add_column(table.name, column, schema=table.schema)
    return tables.reflect_table_from_oid(table_oid, engine).columns[column_data[NAME]]


def alter_column(
        engine,
        table_oid,
        column_index,
        column_definition_dict,
):
    assert len(column_definition_dict) == 1
    column_def_key = list(column_definition_dict.keys())[0]
    column_index = int(column_index)
    attribute_alter_map = {
        NAME: rename_column,
        TYPE: retype_column,
        "type": retype_column,
        NULLABLE: change_column_nullable,
        DEFAULT: set_column_default
    }
    return attribute_alter_map[column_def_key](
        table_oid, column_index, column_definition_dict[column_def_key], engine,
    )


def rename_column(table_oid, column_index, new_column_name, engine):
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
    return tables.reflect_table_from_oid(table_oid, engine).columns[column_index]


def retype_column(table_oid, column_index, new_type, engine):
    table = tables.reflect_table_from_oid(table_oid, engine)
    alteration.alter_column_type(
        table.schema,
        table.name,
        table.columns[column_index].name,
        new_type,
        engine,
        friendly_names=False,
    )
    return tables.reflect_table_from_oid(table_oid, engine).columns[column_index]


def change_column_nullable(table_oid, column_index, nullable, engine):
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
    return tables.reflect_table_from_oid(table_oid, engine).columns[column_index]


def drop_column(table_oid, column_index, engine):
    column_index = int(column_index)
    table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_column(table.name, column.name, schema=table.schema)


def get_column_default(table_oid, column_index, engine):
    table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    return _decode_server_default(column.server_default, engine)


def _decode_server_default(server_default, engine):
    if server_default is not None:
        cast_sql_text = server_default.arg.text
        # Ensure that we never evaluate something that increments a query
        # This is safe as strings will always start with a single quote
        if cast_sql_text.startswith("nextval(") and cast_sql_text.endswith(")"):
            return None
        with engine.begin() as conn:
            # Defaults are returned as text with SQL casts appended
            # Ex: "'test default string'::character varying" or "'2020-01-01'::date"
            # Here, we execute the cast to get the proper python value
            return conn.execute(select(text(cast_sql_text))).first()[0]
    else:
        return None


def set_column_default(table_oid, column_index, default, engine):
    # Note: default should be textual SQL that produces the desired default
    table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    default_clause = DefaultClause(default) if default is not None else default
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.alter_column(
            table.name, column.name, schema=table.schema, server_default=default_clause
        )
    return tables.reflect_table_from_oid(table_oid, engine).columns[column_index]
