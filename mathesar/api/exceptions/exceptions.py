from rest_framework import status

from mathesar.api.exceptions.generic_exceptions.base_exceptions import get_default_exception_detail, MathesarAPIException
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.validation_exceptions.base_exceptions import MathesarValidationException


class NotFoundAPIException(MathesarAPIException):
    error_code = ErrorCodes.NotFound.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_404_NOT_FOUND
    ):
        exception_detail = get_default_exception_detail(exception, self.error_code, message, field, details)._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class MultipleDataFileAPIException(MathesarValidationException):
    error_code = ErrorCodes.MultipleDataFiles.value

    def __init__(
            self,
            message="Multiple data files are unsupported.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class DistinctColumnRequiredAPIException(MathesarValidationException):
    error_code = ErrorCodes.DistinctColumnNameRequired.value

    def __init__(
            self,
            message="Column names must be distinct",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class ColumnSizeMismatchAPIException(MathesarValidationException):
    error_code = ErrorCodes.ColumnSizeMismatch.value

    def __init__(
            self,
            message="Incorrect number of columns in request.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class ValueAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.ValueError.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


