from django.contrib import messages
from django.shortcuts import redirect

from allauth.core.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class SaasSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Social account adapter for the managed-SaaS deployment.

    Enforces three invariants on every sign-up:

    1. The provider returned a non-empty email address.
    2. The provider reports that email as verified.
    3. username = email.

    Also populates ``full_name`` from the provider payload because
    Mathesar's ``User`` model nullifies ``first_name`` / ``last_name``
    and uses ``full_name`` / ``short_name`` instead.

    Sign-ups that violate (1) or (2) are rejected with a user-facing
    error message; the user is redirected back to the login page.
    """

    def pre_social_login(self, request, sociallogin):
        email = (sociallogin.user.email or "").strip().lower()
        if not email:
            messages.error(
                request,
                "Sign-up failed: your provider did not share an email "
                "address.",
            )
            raise ImmediateHttpResponse(redirect("account_login"))

        if not self._email_is_verified(sociallogin, email):
            messages.error(
                request,
                "Sign-up failed: your email is not verified at the "
                "provider. Please verify it and try again.",
            )
            raise ImmediateHttpResponse(redirect("account_login"))

        sociallogin.user.email = email
        return super().pre_social_login(request, sociallogin)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        email = (sociallogin.user.email or data.get("email") or "").strip().lower()
        user.username = email
        user.email = email

        full_name = data.get("name") or " ".join(
            filter(None, [data.get("first_name"), data.get("last_name")])
        )
        if full_name:
            user.full_name = full_name.strip()
        return user

    @staticmethod
    def _email_is_verified(sociallogin, email):
        """
        Check whether the SSO provider reports the given email as verified.

        allauth normalizes provider responses into a list of
        ``EmailAddress`` records on ``sociallogin.email_addresses``;
        each carries a ``verified`` boolean populated from the provider.
        """
        for email_addr in sociallogin.email_addresses:
            if email_addr.email.lower() == email.lower():
                return bool(email_addr.verified)
        return False
