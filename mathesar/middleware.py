import time
import warnings

from django.db import connection, transaction
from django.http import HttpResponseNotAllowed, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from sqlalchemy.exc import InterfaceError

# Paths served directly by HealthCheckMiddleware. The trailing slash is optional
# so a probe configured without it isn't served a 301 redirect, which an
# orchestrator would read as a (false) success.
HEALTH_LIVENESS_PATHS = frozenset({"/healthz/live", "/healthz/live/"})
HEALTH_READINESS_PATHS = frozenset({"/healthz/ready", "/healthz/ready/"})

READINESS_STATEMENT_TIMEOUT_MS = 2000


class HealthCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path in HEALTH_LIVENESS_PATHS:
            return self._serve(request, self._liveness)
        if request.path in HEALTH_READINESS_PATHS:
            return self._serve(request, self._readiness)
        return self.get_response(request)

    def _serve(self, request, check):
        if request.method not in ("GET", "HEAD"):
            return HttpResponseNotAllowed(("GET", "HEAD"))
        return check()

    def _liveness(self):
        return JsonResponse({"status": "ok"})

    def _readiness(self):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        f"SET LOCAL statement_timeout = {READINESS_STATEMENT_TIMEOUT_MS}"
                    )
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
        except Exception:
            return JsonResponse({"status": "unavailable"}, status=503)
        return JsonResponse({"status": "ok"})


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


class PasswordChangeNeededMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        redirect_to_password_change = request.user.is_authenticated and request.user.password_change_needed

        if redirect_to_password_change and request.path != reverse('password_reset_confirm'):
            return HttpResponseRedirect(reverse('password_reset_confirm'))
        response = self.get_response(request)
        return response
