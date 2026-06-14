from django.conf import settings
from django.contrib.auth.views import LoginView
from django.http import HttpResponseForbidden
from django.utils.translation import gettext as _


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
        ctx['terms_of_service_url'] = settings.MATHESAR_TERMS_OF_SERVICE_URL
        ctx['privacy_policy_url'] = settings.MATHESAR_PRIVACY_POLICY_URL
        ctx['login_page_heading'] = (
            settings.MATHESAR_LOGIN_PAGE_HEADING or _('Log in to Mathesar')
        )
        ctx['login_page_body'] = settings.MATHESAR_LOGIN_PAGE_BODY
        ctx['login_page_background'] = settings.MATHESAR_LOGIN_PAGE_BACKGROUND
        return ctx
