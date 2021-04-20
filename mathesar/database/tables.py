from sqlalchemy import Column, Integer, String, Table

from mathesar.database.base import ID, metadata
from mathesar.database.schemas import create_schema

DEFAULT_COLUMNS = [
    Column(ID, Integer, primary_key=True),
]


def create_table(name, schema, column_names, engine):
    """
    This method creates a Postgres table corresponding to a collection.
    """
    create_schema(schema, engine)
    columns = DEFAULT_COLUMNS + [
        Column(column_name, String) for column_name in column_names
    ]
    table = Table(
        name,
        metadata,
        *columns,
        schema=schema,
    )
    table.create(engine)
    return table


def insert_rows_into_table(table, rows, engine):
    with engine.begin() as connection:
        result = connection.execute(table.insert(), rows)
        return result
