from rest_framework import status

from db.columns.exceptions import InvalidTypeError
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import (
    MathesarAPIException,
    get_default_exception_detail,
)


class UniqueViolationAPIException(MathesarAPIException):
    """
    Exception raised when trying to:

    - Add unique constraint to column with non-unique values, or
    - trying to add non-unique value to a column with unique constraint, or
    """
    error_code = ErrorCodes.UniqueViolation.value

    def __init__(
            self,
            exception,
            message="This column has non-unique values so a unique constraint cannot be set",
            field=None,
            details=None,
            table=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        if details is None and table is not None:
            details = {}
            details.update(
                {
                    "original_details": exception.orig.diag.message_detail,
                }
            )

        exception_detail = get_default_exception_detail(
            exception, self.error_code, message, field, details
        )._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class InvalidTypeCastAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.InvalidTypeCast.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, self.err_msg(exception), field, details, status_code)

    @staticmethod
    def err_msg(exception):
        if type(exception) is InvalidTypeError and exception.column_name and exception.new_type:
            return f'"{exception.column_name}" cannot be cast to {exception.new_type}.'
        return 'Invalid type cast requested.'


class UnsupportedTypeAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.UnsupportedType.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class ColumnMappingsNotFound(MathesarAPIException):
    error_code = ErrorCodes.MappingsNotFound.value

    def __init__(
            self,
            exception,
            message="Valid column mappings not found",
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class InvalidJSONFormat(MathesarAPIException):
    error_code = ErrorCodes.InvalidJSONFormat.value

    def __init__(
            self,
            exception=None,
            message='Invalid JSON file.',
            field=None,
            details=None,
            status_code=status.HTTP_400_BAD_REQUEST
    ):
        if exception is None:
            exception = Exception(message)
        super().__init__(exception, self.error_code, message, field, details, status_code)


class UnsupportedJSONFormat(MathesarAPIException):
    error_code = ErrorCodes.UnsupportedJSONFormat.value

    def __init__(
            self,
            exception=None,
            message='This JSON format is not supported.',
            field=None,
            details=None,
            status_code=status.HTTP_400_BAD_REQUEST
    ):
        if exception is None:
            exception = Exception(message)
        super().__init__(exception, self.error_code, message, field, details, status_code)


class UnsupportedFileFormat(MathesarAPIException):
    error_code = ErrorCodes.UnsupportedFileFormat.value

    def __init__(
            self,
            exception=None,
            message='This file format is not supported.',
            field=None,
            details=None,
            status_code=status.HTTP_400_BAD_REQUEST
    ):
        if exception is None:
            exception = Exception(message)
        super().__init__(exception, self.error_code, message, field, details, status_code)
