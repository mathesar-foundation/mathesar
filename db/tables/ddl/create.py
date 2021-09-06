from sqlalchemy import Column, String, Table, MetaData

from db import columns, schemas


def create_mathesar_table(name, schema, columns_, engine, metadata=None):
    """
    This method creates a Postgres table in the specified schema using the
    given name and column list.  It adds internal mathesar columns to the
    table.
    """
    columns_ = columns.init_mathesar_table_column_list_with_defaults(columns_)
    schemas.create_schema(schema, engine)
    # We need this so that we can create multiple mathesar tables in the
    # same MetaData, enabling them to reference each other in the
    # SQLAlchemy context (e.g., for creating a ForeignKey relationship)
    if metadata is None:
        metadata = MetaData(bind=engine, schema=schema)
    table = Table(
        name,
        metadata,
        *columns_,
        schema=schema
    )
    table.create(engine)
    return table


def create_string_column_table(name, schema, column_names, engine):
    """
    This method creates a Postgres table in the specified schema, with all
    columns being String type.
    """
    columns_ = [Column(column_name, String) for column_name in column_names]
    table = create_mathesar_table(name, schema, columns_, engine)
    return table
