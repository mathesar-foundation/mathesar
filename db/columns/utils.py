from sqlalchemy import Table

from db.columns.base import MathesarColumn
from db.columns.defaults import DEFAULT_COLUMNS
from db.columns.exceptions import ColumnMappingsNotFound
from db.types.operations.cast import get_full_cast_map
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


def perfect_map(temp_col_list, target_col_list, engine):
    """
    Returns a list of tuples which contain index of temp table column and its equivalent
    target table column.

    e.g.
    temp_col_list = [('A', PostgresType.INTEGER), ('B', PostgresType.TEXT),
                           ('C', PostgresType.DATE)]

    target_col_list = [('B', PostgresType.TEXT), ('A', PostgresType.INTEGER),
                             ('C', PostgresType.DATE)]

    perfect_map will return [(0, 1), (1, 0), (2, 2)]
    """
    match = list(zip(sorted(temp_col_list), sorted(target_col_list)))
    if all(temp_col[0] == target_col[0] for temp_col, target_col in match):
        result = _build_match_tuple(temp_col_list, target_col_list, match)
        if result and is_type_casting_valid(match, engine):
            return result


def _build_match_tuple(tmp_col_list, trgt_col_list, match):
    return [
        (tmp_col_list.index(temp_col), trgt_col_list.index(target_col))
        for temp_col, target_col in match
    ]


def find_match(temp_col_list, target_col_list, engine):
    """
    Suggests column mappings based on the columns of the temp table and the target table.

    How are column mappings suggested:
    - First it check if only the order of the columns are wrong.
    - Otherwise check if one of the following transforms on the column names return a mapping:
        - Making the column names case insensitive.
        - Replacing an '_'(underscore) between words of column names to a ' '(space).
        - Making the column names case insensitive and replacing an underscore with a space.
    - If none of the above return a column mapping it raises ColumnMappingsNotFound exception.
    """
    if perfect_match := perfect_map(temp_col_list, target_col_list, engine):
        return perfect_match
    else:
        def lowercase(*col_lists):
            """
            Transforms the column names to lowercase.

            e.g.
            lowercase(col_list = [('A', ...), ('B', ...), ('C', ...)], [...])

            returns [[('a', ...), ('b', ...), ('c', ...)], [...]]
            """
            return [
                [(col[0].lower(), *col[1:]) for col in col_list]
                for col_list in col_lists
            ]

        def replace_(*col_lists):
            """
            Transforms the column names by replacing '_'(underscore) with a ' '(space)

            e.g.
            replace_(col_lists = [('A_a', ...), ('B_b', ...), ('C_c', ...)], [...])

            returns [[('A a', ...), ('B b', ...), ('C c', ...)], [...]]
            """
            return [
                [(col[0].replace('_', ' '), *col[1:]) for col in col_list]
                for col_list in col_lists
            ]

        if case_insensitive_match := perfect_map(
            *lowercase(temp_col_list, target_col_list), engine
        ):
            return case_insensitive_match
        elif space_switched_match := perfect_map(
            *replace_(temp_col_list, target_col_list), engine
        ):
            return space_switched_match
        elif space_switched_case_insensetive_match := perfect_map(
            *lowercase(*replace_(temp_col_list, target_col_list)), engine
        ):
            return space_switched_case_insensetive_match
        else:
            raise ColumnMappingsNotFound


def is_type_casting_valid(match, engine):
    """ Checks if the column of the temporary table can be type casted
    to that of a target table if a valid match is found between them. """
    cast_map = get_full_cast_map(engine)
    return all(temp[1] in cast_map.get(target[1]) for temp, target in match)
