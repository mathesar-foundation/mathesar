from rest_framework import status

from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import MathesarAPIException


class GithubReleasesAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details

    def __init__(
        self,
        exception,
        error_code=ErrorCodes.GithubReleasesAPIFailure.value,
        message=None,
        field=None,
        details=None,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, error_code, message, field, details, status_code)
