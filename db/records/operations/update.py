from db.records.operations.select import get_record
from db.tables.utils import get_primary_key_column
from sqlalchemy.exc import DataError
from psycopg2.errors import DatetimeFieldOverflow, InvalidDatetimeFormat
from db.records.exceptions import InvalidDate, InvalidDateFormat


def update_record(table, engine, id_value, record_data):
    primary_key_column = get_primary_key_column(table)
    with engine.begin() as connection:
        try:
            connection.execute(
                table.update().where(primary_key_column == id_value).values(record_data)
            )
        except DataError as e:
            if type(e.orig) == DatetimeFieldOverflow:
                raise InvalidDate
            elif type(e.orig) == InvalidDatetimeFormat:
                raise InvalidDateFormat
            else:
                raise e
    return get_record(table, engine, id_value)
