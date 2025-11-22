from rest_framework import status

from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import MathesarAPIException


class ProgrammingAPIException(MathesarAPIException):

    def __init__(
            self,
            exception,
            error_code=ErrorCodes.ProgrammingError.value,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, error_code, message, field, details, status_code)


class IntegrityAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details

    def __init__(
            self,
            exception,
            error_code=ErrorCodes.NonClassifiedIntegrityError.value,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidDBConnection(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details

    def __init__(
            self,
            exception,
            error_code=ErrorCodes.InvalidConnection.value,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        message = exception.args[0]
        super().__init__(exception, error_code, message, field, details, status_code)
