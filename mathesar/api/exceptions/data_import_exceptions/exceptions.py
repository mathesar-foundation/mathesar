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


class URLDownloadErrorAPIException(MathesarAPIException):

    def __init__(
            self, exception,
            error_code=ErrorCodes.URLDownloadError.value,
            message="URL cannot be downloaded.",
            field=None,
            details=None,
            status_code=status.HTTP_400_BAD_REQUEST
    ):
        super().__init__(exception, error_code, message, field, details, status_code)


class URLNotReachableAPIException(MathesarAPIException):

    def __init__(
            self, exception,
            error_code=ErrorCodes.URLNotReachableError.value,
            message="URL cannot be reached.",
            field=None,
            details=None,
            status_code=status.HTTP_400_BAD_REQUEST
    ):
        super().__init__(exception, error_code, message, field, details, status_code)


class URLInvalidContentTypeAPIException(MathesarAPIException):

    def __init__(
            self, exception,
            error_code=ErrorCodes.URLInvalidContentType.value,
            field=None,
            details=None,
            status_code=status.HTTP_400_BAD_REQUEST
    ):
        message = f"URL resource '{exception.content_type}' not a valid type."
        super().__init__(exception, error_code, message, field, details, status_code)
