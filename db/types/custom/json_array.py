from sqlalchemy import cast
from sqlalchemy.dialects.postgresql import JSONB as SA_JSONB, TEXT
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.compiler import compiles

from db.types.base import MathesarCustomType
from db.types.custom.underlying_type import HasUnderlyingType

DB_TYPE = MathesarCustomType.MATHESAR_JSON_ARRAY.id


class MathesarJsonArray(TypeDecorator, HasUnderlyingType):
    impl = SA_JSONB
    cache_ok = True
    underlying_type = impl

    def get_col_spec(self, **_):
        return DB_TYPE.upper()

    def column_expression(self, column):
        return cast(column, TEXT)

    def coerce_compared_value(self, op, value):
        return self.impl.coerce_compared_value(op, value)


@compiles(MathesarJsonArray, 'postgresql')
def _compile_mathesarjsonobject(element, compiler, **kw):
    unchanged_compiled_string = compiler.visit_JSONB(element, **kw)
    unchanged_id = "JSONB"
    changed_id = MathesarCustomType.MATHESAR_JSON_ARRAY.id.upper()
    changed_compiled_string = unchanged_compiled_string.replace(unchanged_id, changed_id)
    return changed_compiled_string
