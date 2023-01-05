import time
import warnings

from django.http import HttpResponseRedirect
from django.urls import reverse
from sqlalchemy.exc import InterfaceError
from django.shortcuts import redirect


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


class CheckIfUserAlreadyLoggedInMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.user.is_authenticated and request.path == '/auth/login/':
            response = self.get_response(request)
            return response

        return redirect('/')
