from sqlalchemy import Table, MetaData
from sqlalchemy.inspection import inspect


def get_empty_table(name, metadata=MetaData()):
    return Table(name, metadata)


def get_primary_key_column(table):
    primary_key_list = list(inspect(table).primary_key)
    # We do not support getting by composite primary keys
    assert len(primary_key_list) == 1
    return primary_key_list[0]
