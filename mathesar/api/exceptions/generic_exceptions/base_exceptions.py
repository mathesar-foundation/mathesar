from collections import namedtuple

from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.exceptions import APIException

from mathesar.api.exceptions.error_codes import ErrorCodes

ErrorBody = namedtuple(
    'ErrorBody',
    ['code', 'message', 'field', 'details'],
    defaults=[None, None]
)


def get_default_exception_detail(
        exception,
        error_code=ErrorCodes.UnknownError.value,
        message=None,
        field=None,
        details=None
):
    return ErrorBody(
        message=force_str(exception) if message is None else message,
        code=error_code,
        field=field,
        details=details
    )


def get_default_api_exception(exc):
    return MathesarAPIException(exc, ErrorCodes.UnknownError.value)


class MathesarAPIException(APIException):
    def __init__(
            self,
            exception,
            error_code=ErrorCodes.UnknownError.value,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class GenericAPIException(MathesarAPIException):
    """
    Class which is used to convert list of errors into proper MathesarAPIException
    """

    def __init__(self, error_body_list, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.detail = [error_body._asdict() for error_body in error_body_list]
        self.status_code = status_code


class TypeErrorAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details

    def __init__(
            self,
            exception,
            error_code=ErrorCodes.TypeError.value,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, error_code, message, field, details, status_code)


class NotFoundAPIException(MathesarAPIException):

    def __init__(
            self,
            exception,
            error_code=ErrorCodes.NotFound.value,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_404_NOT_FOUND
    ):
        exception_detail = get_default_exception_detail(exception, error_code, message, field, details)._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class ValueAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details

    def __init__(
            self,
            exception,
            error_code=ErrorCodes.ValueError.value,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, error_code, message, field, details, status_code)


class NetworkException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details

    def __init__(
            self,
            exception,
            error_code=ErrorCodes.NetworkError.value,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
    ):
        super().__init__(exception, error_code, message, field, details, status_code)
