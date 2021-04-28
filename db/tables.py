from sqlalchemy import (
    Column, String, Table, MetaData, func, select, ForeignKey
)

from db import constants, schemas
from db import columns as col


def create_string_column_table(name, schema, column_names, engine):
    """
    This method creates a Postgres table in the specified schema, with all
    columns being String type.
    """
    columns = [Column(column_name, String) for column_name in column_names]
    table = create_mathesar_table(name, schema, columns, engine)
    return table


def create_mathesar_table(name, schema, columns, engine, metadata=None):
    """
    This method creates a Postgres table in the specified schema using the
    given name and column list.  It adds internal mathesar columns to the
    table.
    """
    columns = col.init_mathesar_table_column_list_with_defaults(columns)
    schemas.create_schema(schema, engine)
    if metadata is None:
        metadata = MetaData(bind=engine, schema=schema)
    print(metadata.tables)
    metadata.reflect()
    print("REFLECTED:  ", metadata.tables)
    table = Table(
        name,
        metadata,
        *columns,
        schema=schema,
    )
    table.create(engine)
    return table


def extract_columns_from_table(
        old_table_name,
        extracted_column_names,
        extracted_table_name,
        schema,
        engine,
        remainder_table_name=None,
        drop_original_table=False,
):
    old_table = reflect_table(old_table_name, schema, engine)
    old_columns = (
        col.MathesarColumn.from_column(c) for c in old_table.columns
    )
    old_non_default_columns = [
        c for c in old_columns if not c.is_default
    ]
    extracted_columns, remainder_columns = _split_column_list(
        old_non_default_columns, extracted_column_names,
    )
    return extracted_columns, remainder_columns


def _split_column_list(columns, extracted_column_names):
    extracted_columns = [
        c for c in columns if c.name in extracted_column_names
    ]
    remainder_columns = [
        c for c in columns if c.name not in extracted_column_names
    ]
    return extracted_columns, remainder_columns


def _create_split_tables(
        extracted_table_name,
        extracted_columns,
        remainder_table_name,
        remainder_columns,
        schema,
        engine,
):
    print("creating extracted_table")
    extracted_table = create_mathesar_table(
        extracted_table_name,
        schema,
        extracted_columns,
        engine,
    )
    remainder_fk_column = Column(
            f"{extracted_table.name}_{constants.ID}",
            col.ID_TYPE,
            ForeignKey(f"{extracted_table.name}.{constants.ID}"),
            nullable=False,
    )
    print("creating remainder_table")
    remainder_table = create_mathesar_table(
        remainder_table_name,
        schema,
        [remainder_fk_column] + remainder_columns,
        engine,
        metadata=extracted_table.metadata
    )
    return extracted_table, remainder_table, remainder_fk_column.name


def insert_rows_into_table(table, rows, engine):
    with engine.begin() as connection:
        result = connection.execute(table.insert(), rows)
        return result


def reflect_table(name, schema, engine):
    metadata = MetaData()
    return Table(name, metadata, schema=schema, autoload_with=engine)


def get_records(table, engine, limit=None, offset=None):
    query = select(table).limit(limit).offset(offset)
    with engine.begin() as conn:
        return conn.execute(query).fetchall()


def get_count(table, engine):
    query = select([func.count()]).select_from(table)
    with engine.begin() as conn:
        return conn.execute(query).scalar()
