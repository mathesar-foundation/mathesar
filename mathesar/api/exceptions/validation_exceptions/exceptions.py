from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.validation_exceptions.base_exceptions import MathesarValidationException


class IncompatibleFractionDigitValuesAPIException(MathesarValidationException):
    error_code = ErrorCodes.IncompatibleFractionDigitValues.value

    def __init__(
            self,
            message="maximum_fraction_digits cannot be less than minimum_fraction_digits.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


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
        message = "Old password is not correct."
        super().__init__(None, self.error_code, message, field, None)
