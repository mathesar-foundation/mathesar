from rest_framework import status

from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import MathesarAPIException


class GithubReleasesAPIException(MathesarAPIException):
    """
    Builds exception from a Github API response.
    """

    def __init__(
        self,
        response
    ):
        exception = Exception()
        error_code = ErrorCodes.GithubReleasesAPIFailure.value
        field = None
        status_code = response.status_code
        message = f"Github Releases API returned a {status} response."
        try:
            details = response.json()
        except ValueError:
            details = response.text
        super().__init__(exception, error_code, message, field, details, status_code)
