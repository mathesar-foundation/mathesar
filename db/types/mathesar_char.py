from sqlalchemy.dialects.postgresql import CHAR as SA_CHAR
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.compiler import compiles

from db.types.base import PostgresType

class MATHESAR_CHAR(TypeDecorator):
    impl = SA_CHAR

    @classmethod
    def __str__(cls):
        return cls.__name__


@compiles(MATHESAR_CHAR,'postgresql')
def _compile_mathesar_char(element,compiler, **kw):
    unchanged_compiled_string = compiler.visit_VARCHAR(element, **kw)
    unchanged_id = "VARCHAR"
    changed_id = PostgresType.MATHESAR_CHAR.value.upper()
    changed_compiled_string = unchanged_compiled_string.replace(unchanged_id, changed_id)
    return changed_compiled_string