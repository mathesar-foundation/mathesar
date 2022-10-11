import warnings

from django.conf import settings
from django.db import IntegrityError as DjangoIntegrityError
from django.utils.encoding import force_str
from rest_framework.views import exception_handler
from rest_framework_friendly_errors.settings import FRIENDLY_EXCEPTION_DICT
from sqlalchemy.exc import IntegrityError, ProgrammingError

from db.types.exceptions import UnsupportedTypeException
from mathesar.api.exceptions.database_exceptions import (
    base_exceptions as base_api_exceptions,
    exceptions as database_api_exceptions,
)
from mathesar.api.exceptions.data_import_exceptions import exceptions as data_import_api_exceptions
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.exception_mappers import integrity_error_mapper
from mathesar.api.exceptions.generic_exceptions.base_exceptions import get_default_api_exception
from mathesar.errors import URLDownloadError, URLNotReachable, URLInvalidContentTypeError

exception_map = {
    IntegrityError: integrity_error_mapper,
    DjangoIntegrityError: integrity_error_mapper,
    UnsupportedTypeException: lambda exc: database_api_exceptions.UnsupportedTypeAPIException(exc),
    ProgrammingError: lambda exc: base_api_exceptions.ProgrammingAPIException(exc),
    URLDownloadError: lambda exc: data_import_api_exceptions.URLDownloadErrorAPIException(exc),
    URLNotReachable: lambda exc: data_import_api_exceptions.URLNotReachableAPIException(exc),
    URLInvalidContentTypeError: lambda exc: data_import_api_exceptions.URLInvalidContentTypeAPIException(exc)
}


def standardize_error_response(data):
    for index, error in enumerate(data):
        if 'code' in error:
            if error['code'] is not None and str(error['code']) != 'None':
                data[index]['code'] = int(error['code'])
            else:
                data[index]['code'] = ErrorCodes.UnknownError.value
        if 'detail' not in error:
            data[index]['detail'] = error.pop('details', {})
    return data


def mathesar_exception_handler(exc, context):
    response = exception_handler(exc, context)
    # DRF default exception handler does not handle non API errors,
    # So we convert it to proper API response
    if not response:
        # Check if we have an equivalent API exception that is able to convert the exception to proper error
        mapped_exception_class = exception_map.get(exc.__class__)
        if mapped_exception_class is None:
            if getattr(settings, 'MATHESAR_CAPTURE_UNHANDLED_EXCEPTION', False):
                mapped_exception_class = get_default_api_exception
            else:
                raise exc
        api_exception = mapped_exception_class(exc)
        response = exception_handler(api_exception, context)

    if response is not None:
        # Check if conforms to the api spec
        if is_pretty(response.data):
            # Validation exception converts error_codes from integer to string, we need to convert it back into
            response.data = standardize_error_response(response.data)
            return response
        # Certain error raised by drf automatically don't follow the api error spec,
        # so we convert those into proper format
        else:
            warnings.warn("Error Response does not conform to the api spec. Please handle the exception properly")
            error_code = FRIENDLY_EXCEPTION_DICT.get(
                exc.__class__.__name__, None
            )
            if error_code is None and settings.MATHESAR_MODE != "PRODUCTION":
                raise Exception("Error Response does not conform to the api spec. Please handle the exception properly")

            # Errors thrown by drf automatically
            if isinstance(response.data, dict):
                error_message = response.data.pop('detail', '')

                response_data = {}
                response_data['code'] = error_code
                response_data['message'] = error_message
                response_data['details'] = {'exception': force_str(exc)}
                response.data = [response_data]
    return response


def is_pretty(data):
    if not isinstance(data, list):
        return False
    else:
        for error_details in data:
            if (
                    not isinstance(error_details, dict)
                    or 'code' not in error_details
                    or 'message' not in error_details
            ):
                return False
        return True
