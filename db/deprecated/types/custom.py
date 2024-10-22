from sqlalchemy import case, func, and_
from sqlalchemy.dialects.postgresql import (
    CHAR as SA_CHAR,
    DATE as SA_DATE,
    INTERVAL as SA_INTERVAL,
    TIME as SA_TIME,
    TIMESTAMP as SA_TIMESTAMP,
    TEXT as SA_TEXT,
)
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import TypeDecorator, UserDefinedType

from db.types.base import PostgresType, MathesarCustomType
from db.types.custom import money, multicurrency, uri, json_object, json_array
from db.types.custom.underlying_type import HasUnderlyingType
from db.types.exceptions import InvalidTypeParameters

from frozendict import frozendict


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


class DATE(TypeDecorator):
    impl = SA_DATE
    cache_ok = True

    def column_expression(self, column):
        format_str = "YYYY-MM-DD AD"

        return func.to_char(column, format_str)


EMAIL_DB_TYPE = MathesarCustomType.EMAIL.id
EMAIL_DOMAIN_NAME = EMAIL_DB_TYPE + "_domain_name"


class Email(UserDefinedType, HasUnderlyingType):
    underlying_type = SA_TEXT

    def get_col_spec(self, **_):
        # This results in the type name being upper case when viewed.
        # Actual usage in the DB is case-insensitive.
        return EMAIL_DB_TYPE.upper()


class Interval(TypeDecorator, HasUnderlyingType):
    impl = SA_INTERVAL
    cache_ok = True
    underlying_type = SA_TEXT

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


# Mapping of database type enums to SQLAlchemy classes. Primarily to be added to the SA ischema_names dict.
CUSTOM_DB_TYPE_TO_SA_CLASS = frozendict(
    {
        PostgresType.INTERVAL: Interval,
        MathesarCustomType.EMAIL: Email,
        MathesarCustomType.MULTICURRENCY_MONEY: multicurrency.MulticurrencyMoney,
        MathesarCustomType.MATHESAR_MONEY: money.MathesarMoney,
        PostgresType.CHAR: CHAR,
        PostgresType.DATE: DATE,
        PostgresType.TIME_WITH_TIME_ZONE: TIME_WITH_TIME_ZONE,
        PostgresType.TIME_WITHOUT_TIME_ZONE: TIME_WITHOUT_TIME_ZONE,
        PostgresType.TIMESTAMP_WITH_TIME_ZONE: TIMESTAMP_WITH_TIME_ZONE,
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: TIMESTAMP_WITHOUT_TIME_ZONE,
        MathesarCustomType.URI: uri.URI,
        MathesarCustomType.MATHESAR_JSON_OBJECT: json_object.MathesarJsonObject,
        MathesarCustomType.MATHESAR_JSON_ARRAY: json_array.MathesarJsonArray,
    }
)
