from collections import namedtuple
from typing import List

from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.exceptions import APIException

from mathesar.exceptions.error_codes import ErrorCodes

ExceptionBody = namedtuple('ExceptionBody',
                           [
                               'code',
                               'message',
                               'field',
                               'details'
                           ], defaults=[None, None]
                           )


class InvalidTableError(Exception):
    pass


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
                 details=None):
        self.detail = [get_default_exception_detail(exception, error_code, message, field, details)._asdict()]


class CustomValidationError(CustomApiException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'invalid'

    def __init__(self, detail: List[ExceptionBody]):
        self.detail = [exception_body._asdict() for exception_body in detail]
