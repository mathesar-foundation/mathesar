from sqlalchemy import Interval as SAInterval
from sqlalchemy import func, case
from sqlalchemy.types import TypeDecorator


class Interval(TypeDecorator):
    impl = SAInterval
    cache_ok = True

    def column_expression(self, col):
        """
        Given a column, this function constructs a function that writes
        an SQL expression that formats an interval into an ISO 8601
        string.
        """
        iso_8601_format_str = 'PFMYYYY"Y"FMMM"M"FMDD"D""T"FMHH24"H"FMMI"M"'
        return case(
            (col == None, None),
            # For some reason, it's not possible to nicely format
            # including the seconds, so those are concatenated to the
            # end.
            else_=func.concat(
                    func.to_char(col, iso_8601_format_str),
                    func.date_part('seconds', col),
                    'S',
            )
        )
