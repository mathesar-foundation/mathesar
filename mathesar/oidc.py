import traceback

from django.contrib import messages
from django.conf import settings
from django.db import transaction
from django.shortcuts import redirect

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.core.exceptions import ImmediateHttpResponse

from mathesar.models.base import Server, Database, ConfiguredRole, UserDatabaseRoleMap


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

    @transaction.atomic
    def save_user(self, request, sociallogin, form=None):
        # When a role is provisioned to a mathesar user by an admin before SSO login,
        # this code isn't executed as we don't create & save a new User instead we connect their SSO account
        # to the existing User account. So, the User retains the role set by an admin instead of getting default roles.
        saved_user = super().save_user(request, sociallogin, form)
        try:
            role_config_list = settings.OIDC_DEFAULT_PG_ROLE_MAP.get(str(sociallogin.provider), [])
            if role_config_list not in [None, []]:
                for role_config in role_config_list:
                    database_name = role_config["db_name"]
                    host = role_config["host"]
                    port = role_config["port"]
                    role_name = role_config["role_name"]
                    server = Server.objects.get(host=host, port=port)
                    database = Database.objects.get(
                        name=database_name, server=server
                    )
                    configured_role = ConfiguredRole.objects.get(
                        name=role_name,
                        server=server
                    )
                    UserDatabaseRoleMap.objects.get_or_create(
                        user=saved_user,
                        database=database,
                        configured_role=configured_role,
                        server=server
                    )
        except Exception as e:
            traceback.print_exception(type(e), e, e.__traceback__)  # Print the traceback in case of an exception.
            messages.error(request, "Failed to automatically provision default postgres roles.")
            raise ImmediateHttpResponse(redirect("account_login"))
        return saved_user
