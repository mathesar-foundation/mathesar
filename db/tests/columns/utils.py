import decimal

from sqlalchemy import (
    CHAR, FLOAT, SMALLINT, String, Integer, BOOLEAN, TEXT, VARCHAR, select, Table, MetaData, NUMERIC, BIGINT, DECIMAL,
    REAL
)
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, MONEY

from db.types.custom.datetime import (
    DATE, Interval, TIMESTAMP_WITHOUT_TIME_ZONE, TIMESTAMP_WITH_TIME_ZONE,
    TIME_WITHOUT_TIME_ZONE, TIME_WITH_TIME_ZONE,
)
from db.types.custom.email import Email
from db.types.custom.money import MathesarMoney
from db.types.custom import multicurrency
from db.types.custom.uri import URI

column_test_dict = {
    BIGINT: {"start": "499999999999", "set": "500000000000", "expt": 500000000000},
    BOOLEAN: {"start": "false", "set": "true", "expt": True},
    CHAR: {"start": "a", "set": "b", "expt": "b"},
    DECIMAL: {"start": "111.01111", "set": "111.01112", "expt": decimal.Decimal('111.01112')},
    DOUBLE_PRECISION: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    DATE: {"start": "1999-01-15 AD", "set": "1999-01-18 AD", "expt": "1999-01-18 AD"},
    Email: {"start": "alice@example.com", "set": "ob@example.com", "expt": "ob@example.com"},
    Interval: {
        "start": "1 year 2 months 3 days 4 hours 5 minutes 6 seconds",
        "set": "1 year 2 months 3 days 4:05:06",
        "expt": "P1Y2M3DT4H5M6S"
    },

    FLOAT: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    Integer: {"start": "0", "set": "5", "expt": 5},
    # Rounds to 2 digits
    MONEY: {"start": "$12,312.23", "set": "$12,312.24", "expt": "$12,312.24"},
    MathesarMoney: {"start": "12312.23", "set": "12312.24", "expt": decimal.Decimal("12312.24")},
    multicurrency.MulticurrencyMoney: {
        "start": "(1234.12,XYZ)", "set": "(1234.12,XYZ)",
        "expt": {multicurrency.CURRENCY: 'XYZ', multicurrency.VALUE: 1234.12}
    },
    NUMERIC: {"start": "111.01111", "set": "111.01112", "expt": decimal.Decimal('111.01112')},
    REAL: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    SMALLINT: {"start": "500", "set": "500", "expt": 500},
    TIME_WITH_TIME_ZONE: {"start": "12:30:45.0Z", "set": "12:30:45.0+05:30", "expt": '12:30:45.0+05:30'},
    TIME_WITHOUT_TIME_ZONE: {"start": "12:31:00.0", "set": "12:30:00.0", "expt": '12:30:00.0'},
    TIMESTAMP_WITH_TIME_ZONE: {"start": "10000-01-01T00:00:00.0Z AD", "set": "2000-07-30T19:15:03.65Z AD", "expt": '2000-07-30T19:15:03.65Z AD'},
    TIMESTAMP_WITHOUT_TIME_ZONE: {"start": "10000-01-01T00:00:00.0 AD", "set": "2000-07-30T19:15:03.65 AD", "expt": '2000-07-30T19:15:03.65 AD'},
    TEXT: {"start": "default", "set": "test", "expt": "test"},
    String: {"start": "default", "set": "test", "expt": "test"},
    URI: {"start": "https://centerofci.com", "set": "https://centerofci.org", "expt": "https://centerofci.org"},
    VARCHAR: {"start": "default", "set": "test", "expt": "test"},
}


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
