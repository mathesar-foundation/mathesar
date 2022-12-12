from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.validation_exceptions.base_exceptions import MathesarValidationException


class DistinctColumnRequiredAPIException(MathesarValidationException):
    error_code = ErrorCodes.DistinctColumnNameRequired.value

    def __init__(
            self,
            message="Column names must be distinct",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class ColumnSizeMismatchAPIException(MathesarValidationException):
    error_code = ErrorCodes.ColumnSizeMismatch.value

    def __init__(
            self,
            message="Incorrect number of columns in request.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class InvalidLinkChoiceAPIException(MathesarValidationException):
    error_code = ErrorCodes.InvalidLinkChoice.value

    def __init__(
            self,
            message="Invalid Link type",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class MultipleDataFileAPIException(MathesarValidationException):
    error_code = ErrorCodes.MultipleDataFiles.value

    def __init__(
            self,
            message="Multiple data files are unsupported.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class UnknownDatabaseTypeIdentifier(MathesarValidationException):
    error_code = ErrorCodes.UnknownDBType.value

    def __init__(
            self,
            db_type_id,
            field=None,
            details=None,
    ):
        message = f"Unknown database type identifier {db_type_id}."
        super().__init__(None, self.error_code, message, field, details)


class MoneyDisplayOptionValueConflictAPIException(MathesarValidationException):
    error_code = ErrorCodes.MoneyDisplayOptionConflict.value

    def __init__(
            self,
            message="Money type cannot specify a currency code display option as well as other display options.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class IncompatibleFractionDigitValuesAPIException(MathesarValidationException):
    error_code = ErrorCodes.IncompatibleFractionDigitValues.value

    def __init__(
            self,
            message="maximum_fraction_digits cannot be less than minimum_fraction_digits.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class UnsupportedConstraintAPIException(MathesarValidationException):
    error_code = ErrorCodes.UnsupportedConstraint.value

    def __init__(
            self,
            constraint_type,
            field=None,
    ):
        message = f"Operations related to {constraint_type} constraint are currently not supported"
        super().__init__(None, self.error_code, message, field, None)


class ConstraintColumnEmptyAPIException(MathesarValidationException):
    error_code = ErrorCodes.ConstraintColumnEmpty.value

    def __init__(
            self,
            field=None,
    ):
        message = "Constraint column field cannot be empty"
        super().__init__(None, self.error_code, message, field, None)


class InvalidValueType(MathesarValidationException):
    error_code = ErrorCodes.InvalidValueType.value

    def __init__(
            self,
            message=None,
            field=None,
    ):
        if message is None:
            message = "Value's type is invalid."
        super().__init__(None, self.error_code, message, field, None)


class DictHasBadKeys(MathesarValidationException):
    error_code = ErrorCodes.DictHasBadKeys.value

    def __init__(
            self,
            message=None,
            field=None,
    ):
        if message is None:
            message = "Dictionary's keys are invalid or obligatory keys are missing."
        super().__init__(None, self.error_code, message, field, None)


class IncorrectOldPassword(MathesarValidationException):
    error_code = ErrorCodes.IncorrectOldPassword.value

    def __init__(
            self,

            field=None,
    ):
        message = "Old password is not correct"
        super().__init__(None, self.error_code, message, field, None)
