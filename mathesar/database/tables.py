from sqlalchemy import Column, Integer, String, Table

from mathesar.database.schemas import create_schema
from mathesar.database.base import ID, db_name, engine, metadata


DEFAULT_COLUMNS = [
    Column(ID, Integer, primary_key=True),
]


def create_table(name, schema, column_names):
    """
    This method creates a Postgres table corresponding to a collection.
    """
    create_schema(schema)
    columns = DEFAULT_COLUMNS + [
        Column(column_name, String) for column_name in column_names
    ]
    table = Table(
        db_name(name),
        metadata,
        *columns,
        schema=schema,
    )
    table.create(engine)
    return table


def insert_rows_into_table(table, rows):
    with engine.begin() as connection:
        result = connection.execute(table.insert(), rows)
        return result
