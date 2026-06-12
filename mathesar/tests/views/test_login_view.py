"""
Tests for the MathesarLoginView's behavior under SSO-only mode.

Fixtures:
    rf(pytest-django): Provides a Django RequestFactory.
    settings(pytest-django): Lets tests temporarily override Django settings.
"""
import pytest

from django.contrib.auth.models import AnonymousUser
from django.contrib.messages.storage.fallback import FallbackStorage
from django.contrib.sessions.middleware import SessionMiddleware

from mathesar.views.users.login import MathesarLoginView


TERMS_URL = 'https://example.com/terms'
PRIVACY_URL = 'https://example.com/privacy'
TERMS_LINK = (
    f'<a href="{TERMS_URL}" target="_blank" rel="noopener noreferrer">'
    'Terms of Service</a>'
)
PRIVACY_LINK = (
    f'<a href="{PRIVACY_URL}" target="_blank" rel="noopener noreferrer">'
    'Privacy Policy</a>'
)


def _login_page_html(rf, settings):
    settings.MATHESAR_MODE = 'DEVELOPMENT'
    settings.STORAGES = {
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }
    request = rf.get('/auth/login/')
    request.user = AnonymousUser()
    request.LANGUAGE_CODE = 'en'
    SessionMiddleware(lambda request: None).process_request(request)
    request._messages = FallbackStorage(request)
    response = MathesarLoginView.as_view()(request)
    assert response.status_code == 200
    response.render()
    return ' '.join(response.content.decode().split())


def test_login_view_post_forbidden_when_sso_required(rf, settings):
    settings.REQUIRE_SSO_LOGIN = True
    request = rf.post('/auth/login/', data={'username': 'a', 'password': 'b'})
    response = MathesarLoginView.as_view()(request)
    assert response.status_code == 403


def test_login_view_context_includes_sso_required_flag(rf, settings):
    settings.REQUIRE_SSO_LOGIN = True
    view = MathesarLoginView()
    view.setup(rf.get('/auth/login/'))
    ctx = view.get_context_data(form=view.get_form())
    assert ctx['is_sso_login_required'] is True


def test_login_view_context_flag_false_when_sso_not_required(rf, settings):
    settings.REQUIRE_SSO_LOGIN = False
    view = MathesarLoginView()
    view.setup(rf.get('/auth/login/'))
    ctx = view.get_context_data(form=view.get_form())
    assert ctx['is_sso_login_required'] is False


def test_login_view_context_terms_of_service_url_defaults_to_none(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = None
    view = MathesarLoginView()
    view.setup(rf.get('/auth/login/'))
    ctx = view.get_context_data(form=view.get_form())
    assert ctx['terms_of_service_url'] is None


def test_login_view_context_privacy_policy_url_defaults_to_none(rf, settings):
    settings.MATHESAR_PRIVACY_POLICY_URL = None
    view = MathesarLoginView()
    view.setup(rf.get('/auth/login/'))
    ctx = view.get_context_data(form=view.get_form())
    assert ctx['privacy_policy_url'] is None


def test_login_view_context_includes_custom_urls_when_set(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = 'https://example.com/terms'
    settings.MATHESAR_PRIVACY_POLICY_URL = 'https://example.com/privacy'
    view = MathesarLoginView()
    view.setup(rf.get('/auth/login/'))
    ctx = view.get_context_data(form=view.get_form())
    assert ctx['terms_of_service_url'] == 'https://example.com/terms'
    assert ctx['privacy_policy_url'] == 'https://example.com/privacy'


@pytest.mark.django_db
def test_login_page_legal_notice_with_terms_and_privacy(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = TERMS_URL
    settings.MATHESAR_PRIVACY_POLICY_URL = PRIVACY_URL

    html = _login_page_html(rf, settings)

    assert 'By logging in, you agree to the' in html
    assert TERMS_LINK in html
    assert 'and acknowledge the' in html
    assert PRIVACY_LINK in html
    assert 'Terms of Service | Privacy Policy' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_with_terms_only(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = TERMS_URL
    settings.MATHESAR_PRIVACY_POLICY_URL = None

    html = _login_page_html(rf, settings)

    assert 'By logging in, you agree to the' in html
    assert TERMS_LINK in html
    assert 'Privacy Policy' not in html
    assert 'and acknowledge the' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_with_privacy_only(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = None
    settings.MATHESAR_PRIVACY_POLICY_URL = PRIVACY_URL

    html = _login_page_html(rf, settings)

    assert 'By logging in, you acknowledge the' in html
    assert PRIVACY_LINK in html
    assert 'Terms of Service' not in html
    assert 'agree to the' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_renders_when_sso_is_required(rf, settings):
    settings.REQUIRE_SSO_LOGIN = True
    settings.MATHESAR_TERMS_OF_SERVICE_URL = TERMS_URL
    settings.MATHESAR_PRIVACY_POLICY_URL = PRIVACY_URL

    html = _login_page_html(rf, settings)

    assert 'name="username"' not in html
    assert 'name="password"' not in html
    assert 'By logging in, you agree to the' in html
    assert TERMS_LINK in html
    assert 'and acknowledge the' in html
    assert PRIVACY_LINK in html
