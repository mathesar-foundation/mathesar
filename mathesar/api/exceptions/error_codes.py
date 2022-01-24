from enum import Enum, unique


@unique
class ErrorCodes(Enum):
    # Matches with default code of drf-friendly-errors library
    # Api Error
    MethodNotAllowed = 4006
    NotFound = 4005
    UnknownError = 4999
    # Generic Errors
    ProgrammingError = 4101
    TypeError = 4102
    ValueError = 4103

    # Db Error Codes
    DuplicateTableError = 4205
    DuplicateColumnError = 4206
    InvalidTypeCast = 4203
    InvalidTypeOption = 4210
    InvalidDefault = 4211
    NonClassifiedIntegrityError = 4201
    NotNull = 4204
    RaiseException = 4202
    UndefinedFunction = 4207
    UniqueViolation = 4208
    UnsupportedType = 4209

    # Mathesar db Error Codes
    InvalidTableError = 4301

    # Validation Error
    ColumnSizeMismatch = 4401
    DistinctColumnNameRequired = 4402
    MultipleDataFiles = 4400
