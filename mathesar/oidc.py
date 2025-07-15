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
        saved_user = super().save_user(request, sociallogin, form)
        try:
            role_config_list = settings.OIDC_DEFAULT_PG_ROLE_MAP.get(str(sociallogin.provider), [])
            if role_config_list != []:
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
            if settings.DEBUG:
                print(f"OIDC failure: {e}")
            messages.error(request, "Failed to automatically provision default postgres roles.")
            raise ImmediateHttpResponse(redirect("account_login"))
        return saved_user
