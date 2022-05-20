from sqlalchemy import ARRAY, String, func, select, text
from sqlalchemy.types import UserDefinedType

from db.types.base import MathesarCustomType
from db.columns.operations.select import get_column_name_from_attnum
from db.tables.operations.select import reflect_table_from_oid
from db.types.base import get_ma_qualified_schema
from db.types.operations.cast import MONEY_ARR_FUNC_NAME

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


def get_money_array_select_statement(table_oid, engine, column_attnum):
    table = reflect_table_from_oid(table_oid, engine)
    column_name = get_column_name_from_attnum(table_oid, column_attnum, engine)
    package_func = getattr(func, get_ma_qualified_schema())
    money_func = getattr(package_func, MONEY_ARR_FUNC_NAME)
    money_select = money_func((table.c[column_name]), type_=ARRAY(String))
    sel = select(money_select).where(money_select[4].is_not(None))
    return sel


def get_first_money_array_with_symbol(table_oid, engine, money_column_attnum):
    with engine.begin() as conn:
        sel = get_money_array_select_statement(table_oid, engine, money_column_attnum).limit(1)
        data = conn.execute(sel).scalar()
        return data
