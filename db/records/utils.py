from sqlalchemy import Column


def get_column_object(table, col):
    return table.columns[col.name] if isinstance(col, Column) else table.columns[col]
