import time
import warnings


def cursor_closed_handler_middleware(get_response):
    def middleware(request):
        response = get_response(request)
        if response.status_code == 500:
            warnings.warn("Response Status Code 500; trying again.")
            time.sleep(1)
            response = get_response(request)
        return response

    return middleware
