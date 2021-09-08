from sqlalchemy import Table, MetaData

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
