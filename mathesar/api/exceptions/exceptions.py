from collections import namedtuple

from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError

from mathesar.api.exceptions.error_codes import ErrorCodes

ErrorBody = namedtuple(
    'ErrorBody',
    ['code', 'message', 'field', 'details'],
    defaults=[None, None]
)


def get_default_exception_detail(exception, error_code=ErrorCodes.UnknownError.value,
                                 message=None, field=None, details=None):
    return ErrorBody(
        message=force_str(exception) if message is None else message,
        code=error_code,
        field=field,
        details=details
    )


def get_default_api_exception(exc):
    return MathesarAPIException(exc, ErrorCodes.UnknownError.value)


class MathesarAPIException(APIException):
    def __init__(self, exception, error_code=ErrorCodes.UnknownError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class GenericAPIException(MathesarAPIException):
    default_code = 'error'
    """
    Class which is used to convert list of errors into proper MathesarAPIException
    """

    def __init__(self, error_body_list, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.detail = [error_body._asdict() for error_body in error_body_list]
        self.status_code = status_code


class UniqueViolationAPIException(MathesarAPIException):
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


class NotFoundAPIException(MathesarAPIException):
    def __init__(self, exception, error_code=ErrorCodes.NotFound.value, message=None, field=None,
                 details=None, status_code=status.HTTP_404_NOT_FOUND):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class MathesarValidationException(ValidationError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'invalid'

    def __init__(self, exception, error_code=ErrorCodes.UnknownError.value, message=None, field=None,
                 details=None):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = exception_detail


class ProgrammingAPIException(MathesarAPIException):

    def __init__(self, exception, error_code=ErrorCodes.ProgrammingError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class DuplicateTableAPIException(ProgrammingAPIException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.DuplicateTableError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class DuplicateColumnAPIException(ProgrammingAPIException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.DuplicateColumnError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class TypeErrorAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.TypeError.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidDefaultAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.InvalidDefault.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidTypeOptionAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.InvalidTypeOption.value, message=None, field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class MultipleDataFileAPIException(MathesarValidationException):

    def __init__(self, error_code=ErrorCodes.MultipleDataFiles.value,
                 message="Multiple data files are unsupported.",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class DistinctColumnRequiredAPIException(MathesarValidationException):

    def __init__(self, error_code=ErrorCodes.DistinctColumnNameRequired.value,
                 message="Column names must be distinct",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class ColumnSizeMismatchAPIException(MathesarValidationException):

    def __init__(self, error_code=ErrorCodes.ColumnSizeMismatch.value,
                 message="Incorrect number of columns in request.",
                 field=None,
                 details=None,
                 ):
        super().__init__(None, error_code, message, field, details)


class IntegrityAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.NonClassifiedIntegrityError.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class ValueAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.ValueError.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidTypeCastAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.InvalidTypeCast.value,
                 message="Invalid type cast requested.",
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class UndefinedFunctionAPIException(MathesarAPIException):

    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.UndefinedFunction.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class DynamicDefaultAPIException(MathesarAPIException):

    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.UndefinedFunction.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class UnsupportedTypeAPIException(MathesarAPIException):

    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadFilterAPIException(MathesarAPIException):

    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message="Filter arguments are not correct",
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadSortAPIException(MathesarAPIException):

    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class BadGroupAPIException(MathesarAPIException):

    # Default message is not needed as the exception string provides enough details
    def __init__(self, exception, error_code=ErrorCodes.UnsupportedType.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class InvalidTableAPIException(MathesarAPIException):

    def __init__(self, exception, error_code=ErrorCodes.InvalidTableError.value,
                 message='Unable to tabulate data',
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class RaiseExceptionAPIException(MathesarAPIException):
    """
    Exception raised inside a postgres function
    """

    def __init__(self, exception, error_code=ErrorCodes.RaiseException.value,
                 message=None,
                 field=None,
                 details=None, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(exception, error_code, message, field, details, status_code)


class NotNullViolationAPIException(MathesarAPIException):
    """
    Exception raised when trying to add not null constraint to column with null value
     or when trying to add non-null value to a column with not null constraint
    """

    def __init__(self, exception, error_code=ErrorCodes.NotNullViolation.value,
                 message=None,
                 field=None,
                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        message_str, row_detail = exception.orig.args[0].split("DETAIL")
        message_str = message if message is not None else message_str
        details = {'row_parameters': exception.params, 'row_detail': row_detail}
        super().__init__(exception, error_code, message_str, field, details, status_code)
