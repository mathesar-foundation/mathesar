from sqlalchemy.dialects.postgresql.base import TIME as SA_TIME

from db.types import base

TIME_ZONE_DB_TYPE = base.PostgresType.TIME_WITH_TIME_ZONE.value
WITHOUT_TIME_ZONE_DB_TYPE = base.PostgresType.TIME_WITHOUT_TIME_ZONE.value


class TIME_WITHOUT_TIME_ZONE(SA_TIME):
    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make sure it isn't
        # included in the TIME init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        super().__init__(*args, timezone=False, precision=precision, **kwargs)

    @classmethod
    def __str__(cls):
        return cls.__name__


class TIME_WITH_TIME_ZONE(SA_TIME):
    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make sure it isn't
        # included in the TIME init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        super().__init__(*args, timezone=True, precision=precision, **kwargs)

    @classmethod
    def __str__(cls):
        return cls.__name__
