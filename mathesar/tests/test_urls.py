"""
Smoke tests for URL routing.

URL configuration branches on MATHESAR_DEPLOYMENT_TYPE at module
import time, so these tests validate the routes that exist when the
module is loaded under the current deployment type (SELF_HOSTED by
default in tests). The goal is to catch regressions in the
self-hosted URL surface from the managed-SaaS routing changes.
"""
from django.urls import resolve, reverse, Resolver404
import pytest


def test_login_url_resolves():
    """/auth/login/ must always be reachable."""
    assert reverse('login') == '/auth/login/'


def test_oidc_catchall_resolves():
    """/auth/3rdparty/<rest>/ must always be reachable."""
    match = resolve('/auth/3rdparty/login/cancelled/')
    assert match.url_name == 'oidc'


def test_complete_installation_registered_in_self_hosted():
    """In self-hosted, the complete_installation URL must remain registered."""
    from django.conf import settings
    if settings.MATHESAR_DEPLOYMENT_TYPE != settings.DEPLOYMENT_TYPE_SELF_HOSTED:
        pytest.skip("Only meaningful in self-hosted mode")
    assert reverse('complete_installation') == '/complete_installation/'


def test_complete_installation_unregistered_in_managed_saas():
    """In managed-SaaS, complete_installation must NOT be registered."""
    from django.conf import settings
    if settings.MATHESAR_DEPLOYMENT_TYPE != settings.DEPLOYMENT_TYPE_MANAGED_SAAS:
        pytest.skip("Only meaningful in managed-SaaS mode")
    with pytest.raises(Resolver404):
        resolve('/complete_installation/')
