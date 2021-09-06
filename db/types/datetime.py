from sqlalchemy import types as sa_types
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql.base import TIME as SA_TIME


class TIME(SA_TIME):
    impl = sa_types.TIME

    def __init__(self, *args, timezone=False, precision=None, **kwargs):
        super().__init__(*args, timezone=timezone, precision=precision, **kwargs)


@compiles(SA_TIME, "postgresql")
def compile_time_precision(element, compiler, **kwargs):
    # Ensures the TIME type compiles as "TIME" instead of "TIME WITHOUT TIME ZONE"
    stmt = "TIME"
    if element.precision is not None:
        stmt += f"({element.precision})"
    if element.timezone is True:
        stmt += " WITH TIME ZONE"
    return stmt
