from rest_framework import status

from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import MathesarAPIException


class InvalidTableAPIException(MathesarAPIException):
    error_code = ErrorCodes.InvalidTableError.value

    def __init__(
            self,
            exception,
            message='Unable to tabulate data',
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)