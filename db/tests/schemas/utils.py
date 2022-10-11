from sqlalchemy import Table, MetaData, ForeignKey, Column, Integer

from db import constants
from db.schemas.operations.create import create_schema
from db.tables.operations.create import create_mathesar_table
from db.tables.operations.select import reflect_table
from db.metadata import get_empty_metadata


def create_related_table(schema, related_schema, table, related_table, engine):
    create_schema(schema, engine)
    table = create_mathesar_table(table, schema, [], engine)

    create_schema(related_schema, engine)
    # TODO reuse metadata
    metadata = MetaData(schema=related_schema, bind=engine)
    related_table = Table(
        related_table, metadata,
        Column('id', Integer, ForeignKey(table.c[constants.ID]))
    )
    related_table.create()

    # TODO reuse metadata
    related_table = reflect_table(related_table.name, related_schema, engine, metadata=get_empty_metadata())
    fk = list(related_table.foreign_keys)[0]
    assert fk.column.table.schema == schema

    return related_table
