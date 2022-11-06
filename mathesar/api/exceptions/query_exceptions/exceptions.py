from rest_framework import status

from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import MathesarAPIException


class DeletedColumnAccess(Exception):
    def __init__(
            self,
            column_id
    ):
        self.column_id = column_id


class DeletedColumnAccessAPIException(MathesarAPIException):
    """

    """
    error_code = ErrorCodes.DeletedColumnAccess.value

    def __init__(
            self,
            exception,
            query,
            message="Query contains an deleted column",
            field=None,
            status_code=status.HTTP_400_BAD_REQUEST,
    ):

        details = {
            'query': query,
            'column_id': exception.column_id
        }
        super().__init__(exception, self.error_code, message, field, details, status_code)
