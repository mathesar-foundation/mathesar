import logging
import warnings
from sqlalchemy import (
    Column, Integer, ForeignKey, Table, DDL, MetaData, and_, select
)
from db import constants, tables
from db.types import alteration

logger = logging.getLogger(__name__)


NULLABLE = "nullable"
PRIMARY_KEY = "primary_key"
TYPE = "type"

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
        """
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


def get_default_mathesar_column_list():
    return [
        MathesarColumn(
            c,
            DEFAULT_COLUMNS[c][TYPE], primary_key=DEFAULT_COLUMNS[c][PRIMARY_KEY]
        )
        for c in DEFAULT_COLUMNS
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
    column_name = column_data["name"]
    column_type = column_data["type"]
    _preparer = engine.dialect.identifier_preparer
    supported_types = alteration.get_supported_alter_column_types(engine)
    db_type = supported_types.get(column_type.lower())
    if db_type is None:
        logger.warning("Requested type not supported. falling back to String")
        db_type = supported_types[alteration.STRING]
    table = tables.reflect_table_from_oid(table_oid, engine)
    prepared_table_name = _preparer.format_table(table)
    prepared_column_name = _preparer.quote(column_name)
    prepared_type_name = db_type().compile(dialect=engine.dialect)
    alter_stmt = f"""
    ALTER TABLE {prepared_table_name}
      ADD COLUMN {prepared_column_name} {prepared_type_name};
    """
    with engine.begin() as conn:
        conn.execute(DDL(alter_stmt))
    return tables.reflect_table_from_oid(table_oid, engine).columns[column_name]


def alter_column(
        engine,
        table_oid,
        column_index,
        column_definition_dict,
):
    NAME = "name"
    TYPE = "type"
    assert len(column_definition_dict) == 1
    column_def_key = list(column_definition_dict.keys())[0]
    attribute_alter_map = {
        NAME: rename_column, TYPE: retype_column
    }
    return attribute_alter_map[column_def_key](
        table_oid, int(column_index), column_definition_dict[column_def_key], engine,
    )


def rename_column(table_oid, column_index, new_column_name, engine):
    _preparer = engine.dialect.identifier_preparer
    table = tables.reflect_table_from_oid(table_oid, engine)
    column = table.columns[column_index]
    prepared_table_name = _preparer.format_table(table)
    prepared_column_name = _preparer.format_column(column)
    prepared_new_column_name = _preparer.quote(new_column_name)
    alter_stmt = f"""
    ALTER TABLE {prepared_table_name}
    RENAME {prepared_column_name} TO {prepared_new_column_name};
    """
    with engine.begin() as conn:
        conn.execute(DDL(alter_stmt))
    return tables.reflect_table_from_oid(table_oid, engine).columns[column_index]


def retype_column(table_oid, column_index, new_type, engine):
    table = tables.reflect_table_from_oid(table_oid, engine)
    alteration.alter_column_type(
        table.schema,
        table.name,
        table.columns[column_index].name,
        new_type,
        engine,
    )
    return tables.reflect_table_from_oid(table_oid, engine).columns[column_index]
