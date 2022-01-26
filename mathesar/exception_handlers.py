from rest_framework.views import exception_handler

exception_map = {
}


def mathesar_exception_handler(exc, context):
    response = exception_handler(exc, context)
    # DRF default exception handler does not handle non Api errors,
    # So we convert it to proper api response
    if not response:
        # Check if we have an equivalent Api exception that is able to convert the exception to proper error
        APIExceptionClass = exception_map.get(exc.__class__, None)
        if APIExceptionClass:
            api_exception = APIExceptionClass(exc)
            response = exception_handler(api_exception, context)
        else:
            raise exc

    return response
