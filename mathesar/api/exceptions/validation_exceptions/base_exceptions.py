from rest_framework import status
from rest_framework.exceptions import ValidationError

from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import get_default_exception_detail


class MathesarValidationException(ValidationError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'invalid'

    def __init__(
            self,
            exception,
            error_code=ErrorCodes.UnknownError.value,
            message=None,
            field=None,
            details=None
    ):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = exception_detail
