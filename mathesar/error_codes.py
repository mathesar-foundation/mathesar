from enum import Enum, unique


@unique
class ErrorCodes(Enum):
    DistinctColumnNameRequired = 4001
    ColumnSizeMismatch = 4002
    NotNull = 4051
    UniqueViolation = 4052
    InvalidTypeCast = 4053
    UnsupportedType = 4054
    NonClassifiedIntegrityError = 4900
    NonClassifiedError = 4999
