from enum import Enum, unique


@unique
class ErrorCodes(Enum):
    NonClassifiedIntegrityError = 4900
    NonClassifiedError = 4999
    ValueError = 4003
    RaiseException = 4005
    NotFound = 4004
    TypeError = 4006
    # Db Error Codes
    ColumnSizeMismatch = 4002
    DistinctColumnNameRequired = 4001
    InvalidTypeCast = 4053
    NotNull = 4051
    ProgrammingError = 4100
    DuplicateTableError = 4101
    DuplicateColumnError = 4103
    UndefinedFunction = 4104
    UniqueViolation = 4052
    UnsupportedType = 4054
    InvalidTypeOption = 4055
    InvalidDefault = 4056
    # Mathesar db Error Codes
    InvalidTableError = 4102
    # Validation Error
    MultipleDataFiles = 4200
    # Api methods Error
    MethodNotAllowed = 4500
