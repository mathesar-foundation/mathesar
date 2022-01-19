from collections import namedtuple

from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.exceptions import APIException as DRFApiException, ValidationError as DrfValidationError

from mathesar.api.exceptions.error_codes import ErrorCodes

ErrorBody = namedtuple(
    'ErrorBody',
    ['code', 'message', 'field', 'details'],
    defaults=[None, None]
)


def get_default_exception_detail(exception, error_code=ErrorCodes.NonClassifiedError.value,
                                 message=None, field=None, details=None):
    return ErrorBody(
        message=force_str(exception) if message is None else message,
        code=error_code,
        field=field,
        details=details
    )


def get_default_api_exception(exc):
    return APIError(exc, ErrorCodes.NonClassifiedError.value)


class APIError(DRFApiException):
    def __init__(self, exception, error_code=ErrorCodes.NonClassifiedError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class GenericAPIError(APIError):
    default_code = 'error'
    """
    Class which is used to convert list of errors into proper APIError
    """

    def __init__(self, error_body_list, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.detail = [error_body._asdict() for error_body in error_body_list]
        self.status_code = status_code


class UniqueViolationAPIError(APIError):
    def __init__(self,
                 exception,
                 error_code=ErrorCodes.UniqueViolation.value,
                 message="This column has non-unique values so a unique constraint cannot be set",
                 field=None,
                 details=None,
                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class NotFoundAPIError(APIError):
    def __init__(self, exception, error_code=ErrorCodes.NotFound.value, message=None, field=None,
                 details=None, status_code=status.HTTP_404_NOT_FOUND):
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


class ProgrammingAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.ProgrammingError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class DuplicateTableAPIError(ProgrammingAPIError):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.DuplicateTableError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class DuplicateColumnAPIError(ProgrammingAPIError):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.DuplicateColumnError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class TypeErrorAPIError(APIError):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.TypeError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidDefaultAPIError(APIError):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.InvalidDefault.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidTypeOptionAPIError(APIError):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.InvalidTypeOption.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class MultipleDataFileAPIError(ValidationError):

    def __init__(self, error_code=ErrorCodes.MultipleDataFiles.value,
                 message="Multiple data files are unsupported.",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class DistinctColumnRequiredAPIError(ValidationError):

    def __init__(self, error_code=ErrorCodes.DistinctColumnNameRequired.value,
                 message="Column names must be distinct",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class ColumnSizeMismatchAPIError(ValidationError):

    def __init__(self, error_code=ErrorCodes.ColumnSizeMismatch.value,
                 message="Incorrect number of columns in request.",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class IntegrityAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.NonClassifiedIntegrityError.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class ValueAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.ValueError.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidTypeCastAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.InvalidTypeCast.value,
                 message="Invalid type cast requested.",
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class UndefinedFunctionAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.UndefinedFunction.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class DynamicDefaultAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.UndefinedFunction.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class UnsupportedTypeAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadFilterAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message="Filter arguments are not correct",
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadSortAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadGroupAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidTableAPIError(APIError):

    def __init__(self, exception, error_code=ErrorCodes.InvalidTableError.value,
                 message='Unable to tabulate data',
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class RaiseExceptionAPIError(APIError):
    """
    Exception raised inside a postgres function
    """

    def __init__(self, exception, error_code=ErrorCodes.RaiseException.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)
