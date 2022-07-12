from sqlalchemy import text
from sqlalchemy import func
from sqlalchemy.types import UserDefinedType
from sqlalchemy.dialects.postgresql import JSONB as SA_JSONB
from sqlalchemy.types import TypeDecorator
from db.types.base import MathesarCustomType
from sqlalchemy.ext.compiler import compiles

DB_TYPE = MathesarCustomType.MATHESAR_JSON_ARRAY.id


class MathesarJsonArray(TypeDecorator):
    impl = SA_JSONB
    cache_ok = True
    def get_col_spec(self, **_):
        return DB_TYPE.upper()
    
    def column_expression(self, column):
        return func.cast(column, String)

    def coerce_compared_value(self, op, value):
        return self.impl.coerce_compared_value(op, value)

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
