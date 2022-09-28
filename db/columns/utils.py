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
    given_columns = [MathesarColumn.from_column(c) for c in column_list if c.name != constants.ID]
    if len(column_list) != len(given_columns):
        for c in default_columns:
            if c.name == constants.ID:
                c.autoincrement = False
    return default_columns + given_columns


def get_mappings(temp_table_col_list, target_table_col_list):
    return find_match(temp_table_col_list, target_table_col_list)


def perfect_map(temp_table_col_list, target_table_col_list):
    match = list(zip(sorted(temp_table_col_list), sorted(target_table_col_list)))
    result = [(temp_table_col_list.index(i1), target_table_col_list.index(i2)) for i1, i2 in match] if all(i1[0] == i2[0] for i1, i2 in match) else None
    if result is not None:
        check_type_casting(temp_table_col_list, target_table_col_list, match)
    return result


def find_match(temp_table_col_list, target_table_col_list):
    if perfect_match := perfect_map(temp_table_col_list, target_table_col_list) is not None:
        return perfect_match
    else:
        def lowercase(x):
            return [(i[0].lower(), *i[1:]) for i in x]

        def replace_(x):
            return [(i[0].replace('_', ' '), *i[1:]) for i in x]

        if case_insensitive_match := perfect_map(lowercase(temp_table_col_list), lowercase(target_table_col_list)) is not None:
            return case_insensitive_match
        elif space_switched_match := perfect_map(replace_(temp_table_col_list), replace_(target_table_col_list)) is not None:
            return space_switched_match
        elif space_switched_case_insensetive_match := perfect_map(lowercase(replace_(temp_table_col_list)), lowercase(replace_(target_table_col_list))) is not None:
            return space_switched_case_insensetive_match


def check_type_casting(temp_table_col_list, target_table_col_list, match):
    pass
