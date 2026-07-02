"""
Tests for the Mathesar home view.

Fixtures:
    rf(pytest-django): Provides a Django RequestFactory.
    settings(pytest-django): Lets tests temporarily override Django settings.
"""
from django.contrib.auth.models import AnonymousUser

from mathesar.views import home


def test_home_redirects_anonymous_user_to_login_by_default(rf, settings):
    settings.MATHESAR_LANDING_PAGE_URL = None
    request = rf.get('/')
    request.user = AnonymousUser()

    response = home(request)

    assert response.status_code == 302
    assert response.url == '/auth/login/?next=/'


def test_home_redirects_anonymous_user_to_login_when_landing_page_is_blank(
        rf, settings
):
    settings.MATHESAR_LANDING_PAGE_URL = ''
    request = rf.get('/')
    request.user = AnonymousUser()

    response = home(request)

    assert response.status_code == 302
    assert response.url == '/auth/login/?next=/'


def test_home_redirects_anonymous_user_to_landing_page_when_set(rf, settings):
    settings.MATHESAR_LANDING_PAGE_URL = 'https://example.com/start'
    request = rf.get('/')
    request.user = AnonymousUser()

    response = home(request)

    assert response.status_code == 302
    assert response.url == 'https://example.com/start'
