from sqlalchemy import Column, Integer, String, Table, MetaData, select

from db import constants, schemas

DEFAULT_COLUMNS = [
    Column(constants.ID, Integer, primary_key=True),
]


def create_table(name, schema, column_names, engine):
    """
    This method creates a Postgres table.
    """
    schemas.create_schema(schema, engine)
    columns = DEFAULT_COLUMNS + [
        Column(column_name, String) for column_name in column_names
    ]
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


def reflect_table_columns(name, schema, engine):
    t = reflect_table(name, schema, engine)
    return [
        {"name": c.name, "type": c.type} for c in t.columns
    ]


def get_all_table_records(name, schema, engine):
    t = reflect_table(name, schema, engine)
    sel = select(t)
    with engine.begin() as conn:
        return conn.execute(sel).fetchall()
