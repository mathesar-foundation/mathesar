from psycopg2.extras import register_composite
from sqlalchemy import text
from sqlalchemy.types import UserDefinedType

from db.types import base

MONEY = base.MathesarCustomType.MONEY.value

DB_TYPE = base.get_qualified_name(MONEY)


class Money(UserDefinedType):

    def get_col_spec(self, **kw):
        return DB_TYPE.upper()


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


def register(engine):
    with engine.begin() as conn:
        dbapi_curs = conn.connection.cursor()
        register_composite(DB_TYPE, dbapi_curs, globally=True)
