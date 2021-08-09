import logging
import warnings
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import (
    Column, Integer, ForeignKey, Table, MetaData, and_, select, inspect
)
from db import constants, tables
from db.types import alteration

logger = logging.getLogger(__name__)


NAME = "name"
NULLABLE = "nullable"
PRIMARY_KEY = "primary_key"
TYPE = "sa_type"

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
    return result - 1


def create_column(engine, table_oid, column_data):
    column_type = column_data.get(TYPE, column_data["type"])
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
    column = MathesarColumn(
        column_data[NAME], sa_type(**column_type_options), nullable=column_nullable,
    )
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.add_column(table.name, column, schema=table.schema)
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
        "type": retype_column,
        NULLABLE: change_column_nullable,
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


def retype_column(table_oid, column_index, new_type, engine, **kwargs):
    table = tables.reflect_table_from_oid(table_oid, engine)
    type_options = kwargs.get("type_options", {})
    alteration.alter_column_type(
        table.schema,
        table.name,
        table.columns[column_index].name,
        new_type,
        engine,
        friendly_names=False,
        type_options=type_options
    )
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


def drop_column(
        engine,
        table_oid,
        column_index,
):
    column_index = int(column_index)
    table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_column(table.name, column.name, schema=table.schema)
