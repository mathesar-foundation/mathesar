from sqlalchemy import types as sa_types
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql.base import TIME as SA_TIME


class TIME(SA_TIME):
    impl = sa_types.TIME

    def __init__(self, *args, timezone=False, **kwargs):
        super().__init__(*args, timezone=False, **kwargs)


@compiles(SA_TIME, "postgresql")
def compile_time_precision(element, compiler, **kwargs):
    stmt = "TIME"
    if element.precision is not None:
        stmt += f"({element.precision})"
    if element.timezone is True:
        stmt += " WITH TIME ZONE"
    return stmt
