from psycopg2.extras import Json
from sqlalchemy import cast, text, func
from sqlalchemy.types import UserDefinedType

from db.types.base import MathesarCustomType
from db.utils import ignore_duplicate_wrapper

DB_TYPE = MathesarCustomType.MULTICURRENCY_MONEY.id
VALUE = 'value'
CURRENCY = 'currency'


class MulticurrencyMoney(UserDefinedType):

    def get_col_spec(self, **_):
        return DB_TYPE.upper()

    def bind_processor(self, _):
        return lambda x: Json(x)

    def bind_expression(self, bindvalue):
        return func.json_populate_record(cast(None, self.__class__), bindvalue)

    def column_expression(self, col):
        return func.to_json(col)


def install(engine):
    create_type_query = f"""
    CREATE TYPE {DB_TYPE} AS ({VALUE} NUMERIC, {CURRENCY} CHAR(3));
    """
    create_if_not_exist_type_query = ignore_duplicate_wrapper(create_type_query)

    with engine.begin() as conn:
        conn.execute(text(create_if_not_exist_type_query))
        conn.commit()
