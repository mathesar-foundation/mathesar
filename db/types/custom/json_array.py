from sqlalchemy import text
from sqlalchemy.types import UserDefinedType

from db.types.base import MathesarCustomType

DB_TYPE = MathesarCustomType.MATHESAR_JSON_ARRAY.id


class MathesarJsonArray(UserDefinedType):
    impl = postgresql.JSONB
    cache_ok = True
    def get_col_spec(self, **_):
        return DB_TYPE.upper()

    def get_col_spec(self, **_):
        return DB_TYPE.upper()
    
    def column_expression(self, column):
        return func.to_char(column)

@compiles(MathesarJsonArray, 'postgresql')
def _compile_mathesarjsonobject(element, compiler, **kw):
    unchanged_compiled_string = compiler.visit_VARCHAR(element, **kw)
    unchanged_id = "JSONB"
    changed_id = MathesarCustomType.MATHESAR_JSON_ARRAY.id.upper()
    changed_compiled_string = unchanged_compiled_string.replace(unchanged_id, changed_id)
    return changed_compiled_string

def install(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {DB_TYPE};
    """
    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS JSONB CHECK (jsonb_typeof(VALUE) = 'array');
    """

    with engine.begin() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_domain_query))
        conn.commit()
