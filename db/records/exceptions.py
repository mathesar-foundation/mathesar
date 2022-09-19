from sqlalchemy_filters.exceptions import FieldNotFound


# Grouping exceptions follow the sqlalchemy_filters exceptions patterns
class BadGroupFormat(Exception):
    pass


class GroupFieldNotFound(FieldNotFound):
    pass


class InvalidGroupType(Exception):
    pass


class UndefinedFunction(Exception):
    pass


class InvalidDate(Exception):
    pass


class InvalidDateFormat(Exception):
    pass
