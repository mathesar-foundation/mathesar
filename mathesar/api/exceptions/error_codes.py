from enum import Enum, unique


@unique
class ErrorCodes(Enum):
    # Matches with default code of drf-friendly-errors library
    # API Error
    MethodNotAllowed = 4006
    NotFound = 4005
    TableNotFound = 4041
    RecordNotFound = 4042
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
    UniqueImportViolation = 4303

    # Validation Error
    ColumnSizeMismatch = 4401
    DistinctColumnNameRequired = 4402
    MappingsNotFound = 4417
    MultipleDataFiles = 4400
    MoneyDisplayOptionConflict = 4407
    UnsupportedAlter = 4403
    URLDownloadError = 4404
    URLNotReachableError = 4405
    URLInvalidContentType = 4406
    UnknownDBType = 4408
    InvalidDateError = 4413
    InvalidDateFormatError = 4414
    InvalidLinkChoice = 4409
    InvalidReferentTableName = 4419
    InvalidTableName = 4420
    IncompatibleFractionDigitValues = 4410
    UnsupportedConstraint = 4411
    ConstraintColumnEmpty = 4412
    InvalidValueType = 4415
    DictHasBadKeys = 4416
    DeletedColumnAccess = 4418
