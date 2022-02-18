from sqlalchemy import case, func, and_, cast
from sqlalchemy.dialects.postgresql.base import TIME as SA_TIME
from sqlalchemy.dialects.postgresql.base import TIMESTAMP as SA_TIMESTAMP
from sqlalchemy.dialects.postgresql.base import DATE as SA_DATE
from sqlalchemy.types import TypeDecorator

from db.types import base, interval

TIME_ZONE_DB_TYPE = base.PostgresType.TIME_WITH_TIME_ZONE.value
WITHOUT_TIME_ZONE_DB_TYPE = base.PostgresType.TIME_WITHOUT_TIME_ZONE.value
TIMESTAMP_TIME_ZONE_DB_TYPE = base.PostgresType.TIMESTAMP_WITH_TIME_ZONE.value
TIMESTAMP_WITHOUT_TIME_ZONE_DB_TYPE = base.PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE.value
DATE_TYPE = base.PostgresType.DATE


class TIME_WITHOUT_TIME_ZONE(TypeDecorator):
    impl = SA_TIME
    cache_ok = True

    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make
        # sure it isn't included in the TIME init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        TypeDecorator.__init__(
            self, *args, timezone=False, precision=precision, **kwargs
        )

    @classmethod
    def __str__(cls):
        return cls.__name__

    def column_expression(self, column):
        return case(
            (column == None, None),  # noqa
            else_=func.concat(
                func.to_char(column, "HH24:MI"),
                ":",
                func.to_char(
                    func.date_part("seconds", column), "FM00.0999999999"
                ),
            )
        )


class TIME_WITH_TIME_ZONE(TypeDecorator):
    impl = SA_TIME
    cache_ok = True

    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make
        # sure it isn't included in the TIME init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        TypeDecorator.__init__(
            self, *args, timezone=True, precision=precision, **kwargs
        )

    @classmethod
    def __str__(cls):
        return cls.__name__

    def column_expression(self, column):
        return case(
            (column == None, None),  # noqa
            (
                and_(
                    func.date_part("timezone_hour", column) == 0,
                    func.date_part("timezone_minute", column) == 0
                ),
                func.concat(
                    func.to_char(func.date_part("hour", column), "FM00"),
                    ":",
                    func.to_char(func.date_part("minute", column), "FM00"),
                    ":",
                    func.to_char(
                        func.date_part("seconds", column), "FM00.0999999999"
                    ),
                    "Z")
            ),
            else_=func.concat(
                func.to_char(func.date_part("hour", column), "FM00"),
                ":",
                func.to_char(func.date_part("minute", column), "FM00"),
                ":",
                func.to_char(
                    func.date_part("seconds", column), "FM00.0999999999"
                ),
                func.to_char(func.date_part("timezone_hour", column), "S00"),
                ":",
                func.ltrim(
                    func.to_char(func.date_part("timezone_minute", column), "00"),
                    '+- '
                )
            )
        )


class TIMESTAMP_WITHOUT_TIME_ZONE(TypeDecorator):
    impl = SA_TIMESTAMP
    cache_ok = True

    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make
        # sure it isn't included in the TIMESTAMP init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        TypeDecorator.__init__(
            self, *args, timezone=False, precision=precision, **kwargs
        )

    @classmethod
    def __str__(cls):
        return cls.__name__

    def column_expression(self, column):
        base_format_str = 'YYYY-MM-DD"T"HH24:MI'
        return case(
            (column == None, None),  # noqa
            else_=func.concat(
                func.to_char(column, base_format_str),
                ":",
                func.to_char(
                    func.date_part("seconds", column), "FM00.0999999999"
                ),
                func.to_char(column, " BC"),
            )
        )


class TIMESTAMP_WITH_TIME_ZONE(TypeDecorator):
    impl = SA_TIMESTAMP
    cache_ok = True

    def __init__(self, *args, precision=None, **kwargs):
        # On reflection timezone is passed as a kwarg, so we need to make
        # sure it isn't included in the TIMESTAMP init call twice
        if "timezone" in kwargs:
            kwargs.pop("timezone")
        TypeDecorator.__init__(
            self, *args, timezone=True, precision=precision, **kwargs
        )

    @classmethod
    def __str__(cls):
        return cls.__name__

    def column_expression(self, column):
        base_format_str = 'YYYY-MM-DD"T"HH24:MI'
        return case(
            (column == None, None),  # noqa
            (
                and_(
                    func.date_part("timezone_hour", column) == 0,
                    func.date_part("timezone_minute", column) == 0
                ),
                func.concat(
                    func.to_char(column, base_format_str),
                    ":",
                    func.to_char(
                        func.date_part("seconds", column), "FM00.0999999999"
                    ),
                    "Z",
                    func.to_char(column, " BC"),
                )
            ),
            else_=func.concat(
                func.to_char(column, base_format_str),
                ":",
                func.to_char(
                    func.date_part("seconds", column), "FM00.0999999999"
                ),
                func.to_char(func.date_part("timezone_hour", column), "S00"),
                ":",
                func.ltrim(
                    func.to_char(func.date_part("timezone_minute", column), "00"),
                    '+- '
                ),
                func.to_char(column, " BC"),
            )
        )


class DATE(TypeDecorator):
    impl = SA_DATE
    cache_ok = True

    def column_expression(self, column):
        format_str = "YYYY-MM-DD AD"

        return func.to_char(column, format_str)
