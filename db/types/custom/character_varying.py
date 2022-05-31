from sqlalchemy.dialects.postgresql import VARCHAR as SA_VARCHAR
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.compiler import compiles

from db.types.base import PostgresType


class CHARACTER_VARYING(TypeDecorator):
    impl = SA_VARCHAR
    cache_ok = True

    @classmethod
    def __str__(cls):
        return cls.__name__


@compiles(CHARACTER_VARYING, 'postgresql')
def _compile_character_varying(element, compiler, **kw):
    unchanged_compiled_string = compiler.visit_VARCHAR(element, **kw)
    unchanged_id = "VARCHAR"
    changed_id = PostgresType.CHARACTER_VARYING.id.upper()
    changed_compiled_string = unchanged_compiled_string.replace(unchanged_id, changed_id)
    return changed_compiled_string
