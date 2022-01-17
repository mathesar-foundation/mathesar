from enum import Enum, unique


@unique
class ErrorCodes(Enum):
    NonClassifiedIntegrityError = 4900
    NonClassifiedError = 4999

    # Db Error Codes
    ColumnSizeMismatch = 4002
    DistinctColumnNameRequired = 4001
    InvalidTypeCast = 4053
    NotNull = 4051
    ProgrammingError = 4100
    DuplicateTableError = 4101
    UniqueViolation = 4052
    UnsupportedType = 4054
    # Mathesar db Error Codes
    InvalidTableError = 4102
    # Validation Error
    MultipleDataFiles = 4200
