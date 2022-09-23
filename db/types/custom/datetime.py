from sqlalchemy import case, func, and_, TEXT
from sqlalchemy.dialects.postgresql import DATE as SA_DATE
from sqlalchemy.dialects.postgresql import INTERVAL
from sqlalchemy.dialects.postgresql import TIME as SA_TIME
from sqlalchemy.dialects.postgresql import TIMESTAMP as SA_TIMESTAMP
from sqlalchemy.types import TypeDecorator

from db.functions import hints as db_hints
from db.functions.base import DBFunction, sa_call_sql_function
from db.types.exceptions import InvalidTypeParameters


class DATE(TypeDecorator):
    impl = SA_DATE
    cache_ok = True

    def column_expression(self, column):
        format_str = "YYYY-MM-DD AD"

        return func.to_char(column, format_str)


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


class Interval(TypeDecorator):
    impl = INTERVAL
    cache_ok = True

    def __init__(self, *arg, **kwarg):
        TypeDecorator.__init__(self, *arg, **kwarg)
        self.validate_arguments()

    def validate_arguments(self):
        seconds_fields = {
            'SECOND',
            'DAY TO SECOND',
            'HOUR TO SECOND',
            'MINUTE TO SECOND',
        }
        other_fields = {
            'YEAR',
            'MONTH',
            'DAY',
            'HOUR',
            'MINUTE',
            'YEAR TO MONTH',
            'DAY TO HOUR',
            'DAY TO MINUTE',
            'HOUR TO MINUTE',
        }
        all_fields = seconds_fields.union(other_fields)
        if self.impl.precision is not None:
            try:
                assert isinstance(self.impl.precision, int)
            except AssertionError:
                raise InvalidTypeParameters('precision must be an integer')
            try:
                assert (
                    self.impl.fields is None
                    or self.impl.fields.upper() in seconds_fields
                )
            except AssertionError:
                raise InvalidTypeParameters(
                    'If precision and fields are both given,'
                    ' seconds must be included in fields.'
                )
        elif self.impl.fields is not None:
            try:
                assert self.impl.fields.upper() in all_fields
            except AssertionError:
                raise InvalidTypeParameters(
                    f'fields "{self.impl.fields}" is not in {all_fields}'
                )

    def column_expression(self, col):
        """
        Given a column, this function constructs a function that writes
        an SQL expression that formats an interval into an ISO 8601
        string.
        """
        iso_8601_format_str = 'PFMYYYY"Y"FMMM"M"FMDD"D""T"FMHH24"H"FMMI"M"'
        return case(
            (col == None, None),  # noqa
            # For some reason, it's not possible to nicely format
            # including the seconds, so those are concatenated to the
            # end.
            else_=func.concat(
                func.to_char(col, iso_8601_format_str),
                func.date_part('seconds', col),
                'S',
            )
        )


class TruncateToYear(DBFunction):
    id = 'truncate_to_year'
    name = 'Truncate to Year'
    hints = tuple([db_hints.parameter_count(1)])  # TODO extend hints

    @staticmethod
    def to_sa_expression(col):
        return sa_call_sql_function('to_char', col, 'YYYY', return_type=TEXT)


class TruncateToMonth(DBFunction):
    id = 'truncate_to_month'
    name = 'Truncate to Month'
    hints = tuple([db_hints.parameter_count(1)])  # TODO extend hints

    @staticmethod
    def to_sa_expression(col):
        return sa_call_sql_function('to_char', col, 'YYYY-MM', return_type=TEXT)


class TruncateToDay(DBFunction):
    id = 'truncate_to_day'
    name = 'Truncate to Day'
    hints = tuple([db_hints.parameter_count(1)])  # TODO extend hints

    @staticmethod
    def to_sa_expression(col):
        return sa_call_sql_function('to_char', col, 'YYYY-MM-DD', return_type=TEXT)


class CurrentDate(DBFunction):
    id = 'current_date'
    name = 'current date'
    hints = tuple([db_hints.returns(db_hints.date), db_hints.parameter_count(0)])

    @staticmethod
    def to_sa_expression():
        return sa_call_sql_function('current_date', return_type=DATE)


class CurrentTime(DBFunction):
    id = 'current_time'
    name = 'current time'
    hints = tuple([db_hints.returns(db_hints.time), db_hints.parameter_count(0)])

    @staticmethod
    def to_sa_expression():
        return sa_call_sql_function(
            'current_time', return_type=TIME_WITH_TIME_ZONE
        )


class CurrentDateTime(DBFunction):
    id = 'current_datetime'
    name = 'current datetime'
    hints = tuple([db_hints.returns(db_hints.date, db_hints.time), db_hints.parameter_count(0)])

    @staticmethod
    def to_sa_expression():
        return sa_call_sql_function(
            'current_timestamp', return_type=TIMESTAMP_WITH_TIME_ZONE
        )
