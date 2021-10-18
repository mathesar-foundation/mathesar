from sqlalchemy import Table, MetaData

from db.columns.base import MathesarColumn
from db.columns.defaults import DEFAULT_COLUMNS
from db import constants

def get_default_mathesar_column_list():
    return [MathesarColumn(col_name, **DEFAULT_COLUMNS[col_name]) for col_name in DEFAULT_COLUMNS]


def get_mathesar_column_with_engine(col, engine):
    new_column = MathesarColumn.from_column(col)
    new_column.add_engine(engine)
    return new_column


def get_type_options(column):
    return MathesarColumn.from_column(column).type_options


def get_enriched_column_table(table, engine=None):
    table_columns = [MathesarColumn.from_column(c) for c in table.columns]
    if engine is not None:
        for col in table_columns:
            col.add_engine(engine)
    return Table(
        table.name,
        MetaData(),
        *table_columns,
        schema=table.schema
    )


def init_mathesar_table_column_list_with_defaults(column_list):
    default_columns = get_default_mathesar_column_list()
    given_columns = [MathesarColumn.from_column(c) for c in column_list]
    given_column_names = [col_name.name for col_name in given_columns if col_name.name == constants.ID]
    if len(given_column_names) > 0:
        default_columns = [column for column in default_columns if column.name not in given_column_names]
    return default_columns + given_columns
