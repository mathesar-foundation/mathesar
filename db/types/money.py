from sqlalchemy import text
from sqlalchemy.types import UserDefinedType

from db.types.base import MathesarCustomType

DB_TYPE = MathesarCustomType.MATHESAR_MONEY.id


class MathesarMoney(UserDefinedType):

    def get_col_spec(self, **_):
        return DB_TYPE.upper()


def install(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {DB_TYPE};
    """
    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS NUMERIC;
    """

    with engine.begin() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_domain_query))
        conn.commit()
