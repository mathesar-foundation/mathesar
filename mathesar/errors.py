from collections import namedtuple
from typing import List

from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.exceptions import APIException

from mathesar.error_codes import ErrorCodes


class InvalidTableError(Exception):
    pass


ExceptionBody = namedtuple('ExceptionBody',
                           [
                               'error_code',
                               'message',
                               'field',
                               'details'
                           ], defaults=[None, None]
                           )


def get_default_exception_detail(exception, error_code=ErrorCodes.NonClassifiedError,
                                 message=None, field=None, details=None):
    return ExceptionBody(
        message=force_str(exception) if message is None else message,
        error_code=error_code,
        field=field,
        details=details
    )


class CustomApiException(APIException):
    def __init__(self, exception, error_code=ErrorCodes.NonClassifiedError, message=None, field=None, details=None):
        self.detail = [get_default_exception_detail(exception, error_code, message, field, details)]


class CustomValidationError(CustomApiException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'invalid'

    def __init__(self, detail: List[ExceptionBody]):
        self.detail = [exception_body._asdict() for exception_body in detail]
