from sqlalchemy import Table, MetaData, ForeignKey, Column, Integer

from db import constants
from db.schemas import operations as schema_operations
from db.tables.operations.create import create_mathesar_table
from db.tables.utils import reflect_table


def create_related_table(schema, related_schema, table, related_table, engine):
    schema_operations.create_schema(schema, engine)
    table = create_mathesar_table(table, schema, [], engine)

    schema_operations.create_schema(related_schema, engine)
    metadata = MetaData(schema=related_schema, bind=engine)
    related_table = Table(
        related_table, metadata,
        Column('id', Integer, ForeignKey(table.c[constants.ID]))
    )
    related_table.create()

    related_table = reflect_table(related_table.name, related_schema, engine)
    fk = list(related_table.foreign_keys)[0]
    assert fk.column.table.schema == schema

    return related_table
