import warnings

from django.conf import settings
from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler
from sqlalchemy.exc import IntegrityError, ProgrammingError

from db.types.exceptions import UnsupportedTypeException
from mathesar.api.exceptions.api_exception_converters import validation_exception_converter, \
    default_api_exception_converter
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.exceptions import GenericValidationError, get_default_exception_detail, \
    get_default_api_exception, CustomApiException, ProgrammingException

exception_map = {
    # Temporary handlers, must be replaced with proper api exceptions
    IntegrityError: lambda exc: CustomApiException(exc, ErrorCodes.NonClassifiedIntegrityError.value),
    UnsupportedTypeException: lambda exc: GenericValidationError(
            [get_default_exception_detail(exc, ErrorCodes.UnsupportedType.value, message=None)]),
    ProgrammingError: lambda exc: ProgrammingException(exc)
}

non_spec_api_exception_converter_map = {
    ValidationError: validation_exception_converter
}


def mathesar_exception_handler(exc, context):
    response = exception_handler(exc, context)
    # DRF default exception handler does not handle non Api errors,
    # So we convert it to proper api response
    if not response:
        # Check if we have an equivalent Api exception that is able to convert the exception to proper error
        api_exception = exception_map.get(exc.__class__,
                                          get_default_api_exception)(exc)
        response = exception_handler(api_exception, context)

    if response is not None:
        # Check if conforms to the api spec
        if is_pretty(response.data):
            return response
        if settings.DEBUG:
            raise Exception("Error response is not formatted correctly")
        warnings.warn("Error Response does not conform to the api spec. Please handle the exception properly")
        response_data = non_spec_api_exception_converter_map.get(exc.__class__,
                                                                 default_api_exception_converter)(exc, response)
        response.data = response_data
    return response


def is_pretty(data):
    if isinstance(data, list):
        for error_details in data:
            if 'message' in error_details and 'code' in error_details and isinstance(error_details, dict):
                pass
            else:
                return False
        return True
    return False
