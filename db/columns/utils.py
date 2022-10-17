from sqlalchemy import Table

from db.columns.base import MathesarColumn
from db.columns.defaults import DEFAULT_COLUMNS
from db import constants


def get_default_mathesar_column_list():
    return [MathesarColumn(col_name, **DEFAULT_COLUMNS[col_name]) for col_name in DEFAULT_COLUMNS]


def to_mathesar_column_with_engine(col, engine):
    new_column = MathesarColumn.from_column(col)
    new_column.add_engine(engine)
    return new_column


def get_type_options(column):
    return MathesarColumn.from_column(column).type_options


def get_enriched_column_table(table, metadata, engine=None):
    table_columns = [MathesarColumn.from_column(c) for c in table.columns]
    if engine is not None:
        for col in table_columns:
            col.add_engine(engine)
    return Table(
        table.name,
        metadata,
        *table_columns,
        schema=table.schema,
        extend_existing=True,
    )


def init_mathesar_table_column_list_with_defaults(column_list):
    default_columns = get_default_mathesar_column_list()
    given_columns = [MathesarColumn.from_column(c) for c in column_list if c.name != constants.ID]
    if len(column_list) != len(given_columns):
        for c in default_columns:
            if c.name == constants.ID:
                c.autoincrement = False
    return default_columns + given_columns


def get_column_obj_from_relation(relation, column):
    """
    This function can look for anything that's reasonably referred to as
    a column, such as MathesarColumns, SA Columns, or just a column name
    string in the given relation
    """
    try:
        column = find_column_by_name_in_relation(relation, column)
    except AttributeError:
        column = relation.columns[column.name]

    return column


# TODO deal with quotes; still better than the default
def find_column_by_name_in_relation(relation, col_name_string):
    """
    Because we may have to look for the column by a name with an
    inappropriate namespacing (i.e., there may be an errant table or
    schema attached), we iteratively peel any possible namespace off the
    front of the column name string at each call.
    """
    try:
        return relation.columns[col_name_string]
    except KeyError:
        col_name_split = col_name_string.split(sep='.', maxsplit=1)
        if len(col_name_split) <= 1:
            raise KeyError(col_name_string)
        else:
            return find_column_by_name_in_relation(relation, col_name_split[-1])


def get_primary_key_column_collection_from_relation(relation):
    """
    This logic is needed since some "relations" have a primary_key
    attribute that has a column attribute that is a ColumnCollection
    subtype, whereas some relations have a primary_key attribute that is
    itself a ColumnCollection subtype.

    If there is no primary key in the relation, we return NoneType
    """
    pkey = getattr(relation, 'primary_key', None)
    pk_cols = getattr(pkey, 'columns', pkey)
    return pk_cols
