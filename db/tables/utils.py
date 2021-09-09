from sqlalchemy import Table, MetaData
from sqlalchemy.inspection import inspect

from db import columns


def reflect_table(name, schema, engine, metadata=None, connection_to_use=None):
    if metadata is None:
        metadata = MetaData(bind=engine)
    autoload_with = engine if connection_to_use is None else connection_to_use
    return Table(name, metadata, schema=schema, autoload_with=autoload_with, extend_existing=True)


def get_enriched_column_table(raw_sa_table, engine=None):
    table_columns = [
        columns.MathesarColumn.from_column(c) for c in raw_sa_table.columns
    ]
    if engine is not None:
        for col in table_columns:
            col.add_engine(engine)
    return Table(
        raw_sa_table.name,
        MetaData(),
        *table_columns,
        schema=raw_sa_table.schema
    )


def get_empty_table(name):
    return Table(name, MetaData())


def get_primary_key_column(table):
    primary_key_list = list(inspect(table).primary_key)
    # We do not support getting by composite primary keys
    assert len(primary_key_list) == 1
    return primary_key_list[0]
