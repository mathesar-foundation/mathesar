from db.records.operations.select import get_record
from db.tables.utils import get_primary_key_column


def update_record(table, engine, id_value, record_data):
    primary_key_column = get_primary_key_column(table)
    with engine.begin() as connection:
        connection.execute(
            table.update().where(primary_key_column == id_value).values(record_data)
        )
    return get_record(table, engine, id_value)
