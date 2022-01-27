from sqlalchemy import Interval as SAInterval
from sqlalchemy import func, case
from sqlalchemy.types import TypeDecorator


class Interval(TypeDecorator):
    impl = SAInterval

    def column_expression(self, col):
        iso_8601_format = 'PFMYYYY"Y"FMMM"M"FMDD"D""T"FMHH24"H"FMMI"M"'
        return case(
            (col == None, None),
            else_=func.concat(
                    func.to_char(col, iso_8601_format),
                    func.date_part('seconds', col),
                    'S',
            )
        )
