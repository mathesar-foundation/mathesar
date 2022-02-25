import decimal

from sqlalchemy import (
    CHAR, FLOAT, SMALLINT, String, Integer, BOOLEAN, TEXT, VARCHAR, select, Table, MetaData, NUMERIC, BIGINT, DECIMAL,
    REAL, DATE
)
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, MONEY

from db.types import money
from db.types.money import MathesarMoney
from db.types.uri import URI

column_test_dict = {
    BIGINT: {"start": "499999999999", "set": "500000000000", "expt": 500000000000},
    BOOLEAN: {"start": "false", "set": "true", "expt": True},
    CHAR: {"start": "a", "set": "b", "expt": "b"},
    DECIMAL: {"start": "111.01111", "set": "111.01112", "expt": decimal.Decimal('111.01112')},
    DOUBLE_PRECISION: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    DATE: {"start": "1999-01-15 AD", "set": "1999-01-18 AD", "expt": "1999-01-18 AD"},
    FLOAT: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    Integer: {"start": "0", "set": "5", "expt": 5},
    # Rounds to 2 digits
    MONEY: {"start": "$12,312.23", "set": "$12,312.24", "expt": "$12,312.24"},
    MathesarMoney: {"start": "(1234.12,XYZ)", "set": "(1234.12,XYZ)", "expt": {money.CURRENCY: 'XYZ', money.VALUE: 1234.12}},
    NUMERIC: {"start": "111.01111", "set": "111.01112", "expt": decimal.Decimal('111.01112')},
    REAL: {"start": "111.01111", "set": "111.01112", "expt": 111.01112},
    SMALLINT: {"start": "500", "set": "500", "expt": 500},
    TEXT: {"start": "default", "set": "test", "expt": "test"},
    String: {"start": "default", "set": "test", "expt": "test"},
    URI: {"start": "https://centerofci.org", "set": "https://centerofci.org", "expt": "https://centerofci.org"},
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
