from sqlalchemy import cast, text
from sqlalchemy.dialects.postgresql import JSONB as SA_JSONB, TEXT
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.compiler import compiles

from db.types.base import MathesarCustomType
from db.utils import ignore_duplicate_wrapper

DB_TYPE = MathesarCustomType.MATHESAR_JSON_OBJECT.id


class MathesarJsonObject(TypeDecorator):
    impl = SA_JSONB
    cache_ok = True

    def get_col_spec(self, **_):
        return DB_TYPE.upper()

    def column_expression(self, column):
        return cast(column, TEXT)

    def coerce_compared_value(self, op, value):
        return self.impl.coerce_compared_value(op, value)


@compiles(MathesarJsonObject, 'postgresql')
def _compile_mathesarjsonobject(element, compiler, **kw):
    unchanged_compiled_string = compiler.visit_JSONB(element, **kw)
    unchanged_id = "JSONB"
    changed_id = MathesarCustomType.MATHESAR_JSON_OBJECT.id.upper()
    changed_compiled_string = unchanged_compiled_string.replace(unchanged_id, changed_id)
    return changed_compiled_string


def install(engine):
    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS JSONB CHECK (jsonb_typeof(VALUE) = 'object');
    """
    create_if_not_exist_domain_query = ignore_duplicate_wrapper(create_domain_query)

    with engine.begin() as conn:
        conn.execute(text(create_if_not_exist_domain_query))
        conn.commit()
