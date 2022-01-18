from collections import namedtuple
from typing import List

from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError as DrfValidationError

from mathesar.api.exceptions.error_codes import ErrorCodes

ExceptionBody = namedtuple('ExceptionBody',
                           ['code', 'message', 'field', 'details'],
                           defaults=[None, None]
                           )


def get_default_exception_detail(exception, error_code=ErrorCodes.NonClassifiedError.value,
                                 message=None, field=None, details=None):
    return ExceptionBody(
            message=force_str(exception) if message is None else message,
            code=error_code,
            field=field,
            details=details
    )


def get_default_api_exception(exc):
    return CustomApiException(exc, ErrorCodes.NonClassifiedIntegrityError.value)


class CustomApiException(APIException):
    def __init__(self, exception, error_code=ErrorCodes.NonClassifiedError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class ValidationError(DrfValidationError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'invalid'

    def __init__(self, exception, error_code=ErrorCodes.NonClassifiedError.value, message=None, field=None,
                 details=None):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = exception_detail


class ProgrammingException(CustomApiException):

    def __init__(self, exception, error_code=ErrorCodes.ProgrammingError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class DuplicateTableException(CustomApiException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.DuplicateTableError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class MultipleDataFileException(ValidationError):

    def __init__(self, error_code=ErrorCodes.MultipleDataFiles.value,
                 message="Multiple data files are unsupported.",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class DistinctColumnRequiredException(ValidationError):

    def __init__(self, error_code=ErrorCodes.DistinctColumnNameRequired.value,
                 message="Column names must be distinct",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class ColumnSizeMismatchException(ValidationError):

    def __init__(self, error_code=ErrorCodes.ColumnSizeMismatch.value,
                 message="Incorrect number of columns in request.",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class ApiIntegrityException(CustomApiException):

    def __init__(self, exception, error_code=ErrorCodes.NonClassifiedIntegrityError.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class ApiValueError(CustomApiException):

    def __init__(self, exception, error_code=ErrorCodes.ValueError.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class ApiInvalidTypeCastException(ApiIntegrityException):

    def __init__(self, exception, error_code=ErrorCodes.InvalidTypeCast.value,
                 message="Invalid type cast requested.",
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class ApiUnsupportedTypeException(CustomApiException):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadFilterException(CustomApiException):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message="Filter arguments are not correct",
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadSortException(CustomApiException):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadGroupException(CustomApiException):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class ApiInvalidTableError(CustomApiException):

    def __init__(self, exception, error_code=ErrorCodes.InvalidTableError.value,
                 message='Unable to tabulate data',
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class ApiRaiseException(CustomApiException):
    """
    Exception raised inside a postgres function
    """

    def __init__(self, exception, error_code=ErrorCodes.RaiseException.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class GenericApiError(CustomApiException):
    default_code = 'error'

    def __init__(self, detail_list: List[ExceptionBody], status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.detail = [exception_body._asdict() for exception_body in detail_list]
        self.status_code = status_code
