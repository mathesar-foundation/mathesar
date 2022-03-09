import datetime
import decimal
from datetime import date

from sqlalchemy import (
    CHAR, FLOAT, SMALLINT, String, Integer, BOOLEAN, TEXT, VARCHAR, select, Table, MetaData, NUMERIC, BIGINT, DECIMAL,
    REAL
)
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, INTERVAL, MONEY

from db.types.datetime import DATE
from db.types.email import Email
from db.types.money import MathesarMoney
from db.types import multicurrency
from db.types.uri import URI

column_test_dict = {
    BIGINT: {"start": "499999999999", "set": "500000000000", "expt": 500000000000},
    BOOLEAN: {"start": "false", "set": "true", "expt": True},
    CHAR: {"start": "a", "set": "b", "expt": "b"},
    DECIMAL: {"start": "111.01111", "set": "111.01112", "expt": decimal.Decimal('111.01112')},
    DOUBLE_PRECISION: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    DATE: {"start": "1999-01-15 AD", "set": "1999-01-18 AD", "expt": date(1999, 1, 18)},
    INTERVAL: {
        "start": "1 year 2 months 3 days 4 hours 5 minutes 6 seconds",
        "set": "1 year 2 months 3 days 4:05:06",
        "expt": datetime.timedelta(days=428, seconds=14706)
    },

    FLOAT: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    Integer: {"start": "0", "set": "5", "expt": 5},
    # Rounds to 2 digits
    MONEY: {"start": "$12,312.23", "set": "$12,312.24", "expt": "$12,312.24"},
    NUMERIC: {"start": "111.01111", "set": "111.01112", "expt": decimal.Decimal('111.01112')},
    REAL: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    SMALLINT: {"start": "500", "set": "500", "expt": 500},
    TEXT: {"start": "default", "set": "test", "expt": "test"},
    String: {"start": "default", "set": "test", "expt": "test"},
    VARCHAR: {"start": "default", "set": "test", "expt": "test"},
}
custom_type_column_dict = {
    DATE: {"start": "1999-01-15 AD", "set": "1999-01-18 AD", "expt": "1999-01-18 AD"},
    Email: {"start": "alice@example.com", "set": "ob@example.com", "expt": "ob@example.com"},
    INTERVAL: {
        "start": "1 year 2 months 3 days 4 hours 5 minutes 6 seconds",
        "set": "1 year 2 months 3 days 4:05:06",
        "expt": "P1Y2M3DT4H5M6S"
    },
    MathesarMoney: {"start": "12312.23", "set": "12312.24", "expt": decimal.Decimal("12312.24")},
    multicurrency.MulticurrencyMoney: {
        "start": "(1234.12,XYZ)", "set": "(1234.12,XYZ)",
        "expt": {multicurrency.CURRENCY: 'XYZ', multicurrency.VALUE: 1234.12}
    },
    URI: {"start": "https://centerofci.com", "set": "https://centerofci.org", "expt": "https://centerofci.org"},
}

column_test_dict_with_engine = tuple(('engine_with_schema', col_name, col_data) for col_name, col_data in column_test_dict.items()) + tuple(('engine_email_type', col_name, col_data) for col_name, col_data in custom_type_column_dict.items())


def create_test_table(table_name, cols, insert_data, schema, engine):
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        *cols
    )
    table.create()
    with engine.begin() as conn:
        for data in insert_data:
            conn.execute(table.insert().values(data))
    return table


def get_default(engine, table):
    with engine.begin() as conn:
        conn.execute(table.insert())
        return conn.execute(select(table)).fetchall()[0][0]
