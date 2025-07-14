from django.shortcuts import redirect
from django.contrib import messages

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.core.exceptions import ImmediateHttpResponse
from django.conf import settings


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        allowed_email_domains = [domain.lower() for domain in settings.OIDC_ALLOWED_EMAIL_DOMAINS.get(str(sociallogin.provider), [])]
        if (
            allowed_email_domains not in [None, []]
            and sociallogin.user.email.lower().split('@')[-1] not in allowed_email_domains
        ):
            allowed_email_domains_str = ', '.join(allowed_email_domains)
            messages.error(request, f"Only {allowed_email_domains_str} emails are allowed.")
            raise ImmediateHttpResponse(redirect("account_login"))
        return super().pre_social_login(request, sociallogin)
