from rest_framework.views import exception_handler

exception_map = {
}


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
