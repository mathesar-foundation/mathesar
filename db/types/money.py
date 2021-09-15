from enum import Enum

from psycopg2.extras import Json
from sqlalchemy import cast, text, func
from sqlalchemy.types import UserDefinedType

from db.types import base

MONEY = base.MathesarCustomType.MONEY.value

DB_TYPE = base.get_qualified_name(MONEY)
VALUE = 'value'
CURRENCY = 'currency'


class Money(UserDefinedType):

    def get_col_spec(self, **kw):
        return DB_TYPE.upper()

    def bind_processor(self, dialect):
        return lambda x: Json(x)

    def bind_expression(self, bindvalue):
        return func.json_populate_record(cast(None, self.__class__), bindvalue)

    def column_expression(self, col):
        return func.to_json(col)


def install(engine):

    drop_type_query = f"""
    DROP TYPE IF EXISTS {DB_TYPE};
    """

    create_type_query = f"""
    CREATE TYPE {DB_TYPE} AS ({VALUE} NUMERIC, {CURRENCY} CHAR(3));
    """

    with engine.begin() as conn:
        conn.execute(text(drop_type_query))
        conn.execute(text(create_type_query))
        conn.commit()


def _build_money_domain_python_type(currency_code):
    db_type = base.get_qualified_name(currency_code.value)
    return type(
        f'{currency_code.name}',
        (UserDefinedType,),
        {'DB_TYPE': db_type, 'get_col_spec': lambda self, **kw: db_type.upper()}
    )


MathesarMoneyDomain = Enum(
    'MathesarMoneyDomain',
    {
        currency_code.value: _build_money_domain_python_type(currency_code)
        for currency_code in base.MathesarCurrencyCode
    }
)


def install_money_domain_types(engine):
    with engine.begin() as conn:
        for currency_code in MathesarMoneyDomain:
            db_type = currency_code.value.DB_TYPE
            conn.execute(text(f"""DROP DOMAIN IF EXISTS {db_type};"""))
            conn.execute(text(f"""CREATE DOMAIN {db_type} NUMERIC;"""))
        conn.commit()
