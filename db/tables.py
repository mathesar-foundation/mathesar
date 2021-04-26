from sqlalchemy import Column, String, Table, MetaData
from sqlalchemy.orm import Session

from db import schemas
from db.columns import init_mathesar_table_column_list_with_defaults


def create_string_column_table(name, schema, column_names, engine):
    """
    This method creates a Postgres table in the specified schema, with all
    columns being String type.
    """
    columns = [Column(column_name, String) for column_name in column_names]
    table = create_mathesar_table(name, schema, columns, engine)
    return table


def create_mathesar_table(name, schema, columns, engine):
    """
    This method creates a Postgres table in the specified schema using the
    given name and column list.  It adds internal mathesar columns to the
    table.
    """
    columns = init_mathesar_table_column_list_with_defaults(columns)
    schemas.create_schema(schema, engine)
    metadata = MetaData(bind=engine)
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


def reflect_table(name, schema, engine):
    metadata = MetaData()
    return Table(name, metadata, schema=schema, autoload_with=engine)


def get_query(table, engine):
    with Session(engine) as session:
        query = session.query(table)
        return query
