from sqlalchemy.dialects.postgresql.base import TIME as SA_TIME
from sqlalchemy.dialects.postgresql.base import TIMESTAMP as SA_TIMESTAMP

from db.types import base

TIME_ZONE_DB_TYPE = base.PostgresType.TIME_WITH_TIME_ZONE.value
WITHOUT_TIME_ZONE_DB_TYPE = base.PostgresType.TIME_WITHOUT_TIME_ZONE.value
TIMESTAMP_TIME_ZONE_DB_TYPE = base.PostgresType.TIMESTAMP_WITH_TIME_ZONE.value
TIMESTAMP_WITHOUT_TIME_ZONE_DB_TYPE = base.PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE.value


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


class TIMESTAMP_WITHOUT_TIME_ZONE(SA_TIMESTAMP):
    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make sure it isn't
        # included in the TIMESTAMP init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        super().__init__(*args, timezone=False, precision=precision, **kwargs)

    @classmethod
    def __str__(cls):
        return cls.__name__


class TIMESTAMP_WITH_TIME_ZONE(SA_TIMESTAMP):
    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make sure it isn't
        # included in the TIMESTAMP init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        super().__init__(*args, timezone=True, precision=precision, **kwargs)

    @classmethod
    def __str__(cls):
        return cls.__name__