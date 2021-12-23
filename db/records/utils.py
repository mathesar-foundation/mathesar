from sqlalchemy import Column


def create_col_objects(table, column_list):
    return [get_column_object(table, col) for col in column_list]


def get_column_object(table, col):
    return table.columns[col.name] if isinstance(col, Column) else table.columns[col]
