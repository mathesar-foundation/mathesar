from sqlalchemy.dialects.postgresql import INTERVAL
from sqlalchemy import func, case
from sqlalchemy.types import TypeDecorator

from db.types.exceptions import InvalidTypeParameters


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
