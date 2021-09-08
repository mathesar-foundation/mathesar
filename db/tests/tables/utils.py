from sqlalchemy import MetaData, Column, Table, ForeignKey, Integer

from db import constants


def create_related_table(name, table, schema, engine):
    metadata = MetaData(schema=schema, bind=engine)
    related_table = Table(
        name, metadata,
        Column('id', Integer, ForeignKey(table.c[constants.ID]))
    )
    related_table.create()
    fk = list(related_table.foreign_keys)[0]
    assert fk.column.table.name == table.name
    return related_table
