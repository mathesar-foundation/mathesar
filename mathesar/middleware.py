from collections import defaultdict
import time
import warnings

from django.conf import settings
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


class LiveDemoModeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self._available_dbs = (
            name for name in settings.DATABASES
            if name not in ['default', 'mathesar_tables']
        )
        self._session_db_map = defaultdict(
            lambda: next(self._available_dbs), {None: 'mathesar_tables'}
        )

    def __call__(self, request):
        if settings.LIVE_DEMO:
            sessionid = request.COOKIES.get('sessionid', None)
            database = self._session_db_map[sessionid]
            print(f"Using database {database} for sessionid {sessionid}")
            params = request.GET.copy()
            params.update({'database': database})
            request.GET = params

        response = self.get_response(request)
        return response
