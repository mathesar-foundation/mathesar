class InvalidDefaultError(Exception):
    pass


class InvalidTypeError(Exception):
    pass


class InvalidTypeOptionError(Exception):
    pass


class DagCycleError(Exception):
    pass


class DynamicDefaultWarning(Warning):
    pass


class NotNullError(Exception):
    pass


class ForeignKeyError(Exception):
    pass


class TypeMismatchError(Exception):
    pass


class UniqueValueError(Exception):
    pass


class ExclusionError(Exception):
    pass


class ColumnMappingsNotFound(Exception):
    pass


class InvalidStringTruncation(Exception):
    pass
