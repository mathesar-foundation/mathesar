import time
import warnings

from sqlalchemy.exc import InterfaceError


class CursorClosedHandlerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        if isinstance(exception, InterfaceError):
            warnings.warn("InterfaceError caught; trying again.")
            time.sleep(1)
            response = self.get_response(request)
            return response
