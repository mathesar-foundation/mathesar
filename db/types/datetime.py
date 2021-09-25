from sqlalchemy import types as sa_types
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql.base import TIME as SA_TIME


class TIME_WITHOUT_TIME_ZONE(sa_types.TypeDecorator):
    impl = SA_TIME

    def __init__(self, *args, precision=None, **kwargs):
        super().__init__(*args, timezone=False, precision=precision, **kwargs)


class TIME_WITH_TIME_ZONE(sa_types.TypeDecorator):
    impl = SA_TIME

    def __init__(self, *args, precision=None, **kwargs):
        super().__init__(*args, timezone=True, precision=precision, **kwargs)


@compiles(SA_TIME, "postgresql")
def compile_time_precision(element, compiler, **kwargs):
    # Ensures the TIME type compiles as "TIME" instead of "TIME WITHOUT TIME ZONE"
    stmt = "TIME"
    if element.precision is not None:
        stmt += f"({element.precision})"
    if element.timezone is True:
        stmt += " WITH TIME ZONE"
    else:
        stmt += " WITHOUT TIME ZONE"
    return stmt
