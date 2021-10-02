from sqlalchemy import types as sa_types
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql.base import TIME as SA_TIME

from db.types import base

TIME_ZONE_DB_TYPE = base.PostgresType.TIME_WITH_TIME_ZONE.value
WITHOUT_TIME_ZONE_DB_TYPE = base.PostgresType.TIME_WITHOUT_TIME_ZONE.value

class TIME_WITHOUT_TIME_ZONE(sa_types.TypeDecorator):
    impl = SA_TIME
    cache_ok = True

    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make sure it isn't
        # included in the TIME init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        super().__init__(*args, timezone=False, precision=precision, **kwargs)


class TIME_WITH_TIME_ZONE(sa_types.TypeDecorator):
    impl = SA_TIME
    cache_ok = True

    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make sure it isn't
        # included in the TIME init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
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
