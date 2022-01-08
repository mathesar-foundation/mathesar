from collections import namedtuple
from typing import List

from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler
from rest_framework_friendly_errors.mixins import FriendlyErrorMessagesMixin
from rest_framework_friendly_errors.settings import FRIENDLY_EXCEPTION_DICT
from sqlalchemy.exc import IntegrityError

from mathesar.error_codes import ErrorCodes


class MathesarErrorMessageMixin(FriendlyErrorMessagesMixin):

    def build_pretty_errors(self, errors):
        e = super().build_pretty_errors(errors)
        return e['errors']


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
        self.detail = [get_default_exception_detail(exception, error_code, message, field, details)._asdict()]


class CustomValidationError(CustomApiException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'invalid'

    def __init__(self, detail: List[ExceptionBody]):
        self.detail = [exception_body._asdict() for exception_body in detail]


exception_map = {
    IntegrityError: lambda exc: CustomApiException(exc, ErrorCodes.NonClassifiedIntegrityError.value)
}


def is_pretty(response):
    data = response.data
    if isinstance(data, list):
        for error_details in data:
            if 'message' in error_details and 'code' in error_details and isinstance(data, dict):
                pass
            else:
                return False
        return True
    return False


def mathesar_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if not response:
        api_exception = exception_map.get(exc,
                                          default=CustomApiException(ExceptionBody(ErrorCodes.NonClassifiedError, exc)))
        response = exception_handler(api_exception, context)

    if response is not None:
        if is_pretty(response):
            return response
        error_code = FRIENDLY_EXCEPTION_DICT.get(
                exc.__class__.__name__)

        response.data['code'] = error_code
        response.data['message'] = force_str(exc)
        response.data['details'] = response.data.pop('detail', {})

    return response
