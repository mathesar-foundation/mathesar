from rest_framework import status

from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import MathesarAPIException


class UpgradeAPIException(MathesarAPIException):
    """
    Builds exception from a response from mathesar-update-companion.
    """

    def __init__(
        self,
        response
    ):
        exception = None
        error_code = ErrorCodes.MathesarUpdateFailure.value
        field = None
        status_code = response.status_code
        message = f"Mathesar update companion returned a {status} response."
        try:
            details = response.json()
        except ValueError:
            details = response.text
        super().__init__(exception, error_code, message, field, details, status_code)
