from enum import Enum, unique


@unique
class ErrorCodes(Enum):
    # Matches with default code of drf-friendly-errors library
    # API Error
    MethodNotAllowed = 4006
    NotFound = 4005
    UnknownError = 4999
    # Generic Errors
    ProgrammingError = 4101
    TypeError = 4102
    ValueError = 4103

    # DB Error Codes
    DuplicateTableError = 4205
    DuplicateColumnError = 4206
    ExclusionViolation = 4213
    ForeignKeyViolation = 4212
    InvalidTypeCast = 4203
    InvalidTypeOption = 4210
    InvalidDefault = 4211
    NonClassifiedIntegrityError = 4201
    NotNullViolation = 4204
    RaiseException = 4202
    TypeMismatchViolation = 4214
    UndefinedFunction = 4207
    UniqueViolation = 4208
    UnsupportedType = 4209

    # Data Imports error code
    InvalidTableError = 4301
    NotNullImportViolation = 4302
    UniqueImportViolation = 4303

    # Validation Error
    ColumnSizeMismatch = 4401
    DistinctColumnNameRequired = 4402
    MultipleDataFiles = 4400
    MoneyDisplayOptionConflict = 4407
    UnsupportedAlter = 4403
    URLDownloadError = 4404
    URLNotReachableError = 4405
    URLInvalidContentType = 4406
    UnknownDBType = 4408
    InvalidLinkChoice = 4409
    IncompatibleFractionDigitValues = 4410
