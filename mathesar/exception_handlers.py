from rest_framework.views import exception_handler

from mathesar.api.exceptions.error_codes import ErrorCodes

exception_map = {
}


def fix_error_response(data):
    for index, error in enumerate(data):
        if 'code' in error:
            if error['code'] is not None and str(error['code']) != 'None':
                data[index]['code'] = int(error['code'])
            else:
                data[index]['code'] = ErrorCodes.NonClassifiedError.value
        if 'detail' not in error:
            data[index]['detail'] = error.pop('details', {})
    return data


def mathesar_exception_handler(exc, context):
    response = exception_handler(exc, context)
    # DRF default exception handler does not handle non Api errors,
    # So we convert it to proper api response
    if not response:
        # Check if we have an equivalent Api exception that is able to convert the exception to proper error
        ApiExceptionClass = exception_map.get(exc.__class__, None)
        if ApiExceptionClass:
            api_exception = ApiExceptionClass(exc)
            response = exception_handler(api_exception, context)
        else:
            raise exc

    if response is not None:
        # Check if conforms to the api spec
        if is_pretty(response.data):
            # Validation exception converts error_codes from integer to string, we need to convert it back into
            response.data = fix_error_response(response.data)
            return response
    return response


def is_pretty(data):
    if isinstance(data, list):
        for error_details in data:
            if isinstance(error_details, dict) and 'code' in error_details and 'message' in error_details:
                pass
            else:
                return False
        return True
    return False
