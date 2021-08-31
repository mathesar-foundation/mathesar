from psycopg2.extras import Json
from sqlalchemy import cast, text, func
from sqlalchemy.types import UserDefinedType

from db.types import base

MONEY = base.MathesarCustomType.MONEY.value

DB_TYPE = base.get_qualified_name(MONEY)


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
    CREATE TYPE {DB_TYPE} AS (value NUMERIC, currency CHAR(3));
    """

    with engine.begin() as conn:
        conn.execute(text(drop_type_query))
        conn.execute(text(create_type_query))
        conn.commit()
