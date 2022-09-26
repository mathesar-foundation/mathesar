from sqlalchemy.dialects.postgresql import CHAR as SA_CHAR
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.compiler import compiles

from db.types.base import PostgresType


class CHAR(TypeDecorator):
    impl = SA_CHAR
    cache_ok = True

    @classmethod
    def __str__(cls):
        return cls.__name__


@compiles(CHAR, 'postgresql')
def _compile_char(element, compiler, **kw):
    unchanged_compiled_string = compiler.visit_VARCHAR(element, **kw)
    unchanged_id = "VARCHAR"
    changed_id = PostgresType.CHAR.id
    changed_compiled_string = unchanged_compiled_string.replace(unchanged_id, changed_id)
    return changed_compiled_string
