from django.conf import settings
from django.contrib.auth.views import LoginView
from django.http import HttpResponseForbidden


class MathesarLoginView(LoginView):
    def post(self, request, *args, **kwargs):
        if settings.REQUIRE_SSO_LOGIN:
            return HttpResponseForbidden(
                "Password authentication is disabled. Please log in using SSO."
            )
        return super().post(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['is_sso_login_required'] = settings.REQUIRE_SSO_LOGIN
        return ctx
