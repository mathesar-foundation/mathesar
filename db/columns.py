from sqlalchemy import Column, Integer, ForeignKey, Table, DDL, MetaData
from db import constants


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
            DEFAULT_COLUMNS[c][TYPE],
            primary_key=DEFAULT_COLUMNS[c][PRIMARY_KEY]
        )
        for c in DEFAULT_COLUMNS
    ]


def init_mathesar_table_column_list_with_defaults(column_list):
    default_columns = get_default_mathesar_column_list()
    given_columns = [MathesarColumn.from_column(c) for c in column_list]
    return default_columns + given_columns


def rename_column(schema, table_name, column_name, new_column_name, engine):
    _preparer = engine.dialect.identifier_preparer
    with engine.begin() as conn:
        metadata = MetaData(bind=engine, schema=schema)
        table = Table(table_name, metadata, schema=schema, autoload_with=engine)
        column = table.columns[column_name]
        prepared_table_name = _preparer.format_table(table)
        prepared_column_name = _preparer.format_column(column)
        prepared_new_column_name = _preparer.quote(new_column_name)
        alter_stmt = f"""
        ALTER TABLE {prepared_table_name}
        RENAME {prepared_column_name} TO {prepared_new_column_name}
        """
        conn.execute(DDL(alter_stmt))
