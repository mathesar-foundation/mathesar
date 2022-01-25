from django.utils.encoding import force_str
from rest_framework_friendly_errors.settings import FRIENDLY_EXCEPTION_DICT

from mathesar.api.exceptions.error_codes import ErrorCodes


def default_api_exception_converter(exc, response):
    if isinstance(response.data, list):
        converted_data = []
        for data in response.data:
            new_data = {'code': ErrorCodes.NonClassifiedError.value,
                        'message': data['message'] if 'message' in data else force_str(exc),
                        'details': data.get('detail', {})}
            converted_data.append(new_data)
        return converted_data
    else:
        error_code = FRIENDLY_EXCEPTION_DICT.get(exc.__class__.__name__)
        error_data = {'code': error_code,
                      'message': force_str(exc),
                      'details': response.data.pop('detail', {})}
        return [error_data]
