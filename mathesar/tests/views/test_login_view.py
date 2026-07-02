"""
Tests for the MathesarLoginView's login behavior and rendered login page.

Fixtures:
    rf(pytest-django): Provides a Django RequestFactory.
    settings(pytest-django): Lets tests temporarily override Django settings.
"""
from html.parser import HTMLParser

import pytest

from django.contrib.auth.models import AnonymousUser
from django.contrib.messages.storage.fallback import FallbackStorage
from django.contrib.sessions.middleware import SessionMiddleware

from mathesar.views.users.login import MathesarLoginView
from mathesar.views.users.password_reset import MathesarPasswordResetConfirmView


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
CUSTOM_LOGO_URL = 'https://example.com/logo.svg'
CUSTOM_INSTANCE_NAME = 'Mathesar Cloud'
CUSTOM_HEADING = 'Welcome to your Mathesar workspace'
CUSTOM_BODY = '<strong>Sign in to start working.</strong>'
CUSTOM_BACKGROUND = 'linear-gradient(#123842, #0b222b)'


class _StartTagParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


def _login_page_html(rf, settings, language_code='en'):
    return _render_auth_view(
        rf, settings, MathesarLoginView.as_view(), '/auth/login/',
        language_code=language_code,
    )


def _password_reset_page_html(rf, settings, admin_user):
    return _render_auth_view(
        rf,
        settings,
        MathesarPasswordResetConfirmView.as_view(),
        '/auth/password_reset_confirm/',
        user=admin_user,
    )


def _render_auth_view(rf, settings, view, path, user=None, language_code='en'):
    settings.MATHESAR_MODE = 'DEVELOPMENT'
    settings.STORAGES = {
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }
    request = rf.get(path)
    request.user = user or AnonymousUser()
    request.LANGUAGE_CODE = language_code
    SessionMiddleware(lambda request: None).process_request(request)
    request._messages = FallbackStorage(request)
    response = view(request)
    assert response.status_code == 200
    response.render()
    return ' '.join(response.content.decode().split())


def _find_start_tags(html, tag_name, **expected_attrs):
    parser = _StartTagParser()
    parser.feed(html)
    return [
        attrs
        for tag, attrs in parser.tags
        if tag == tag_name
        and all(attrs.get(name) == value for name, value in expected_attrs.items())
    ]


def _assert_link_attrs(html, href):
    links = _find_start_tags(html, 'a', href=href)
    assert len(links) == 1
    assert links[0]['target'] == '_blank'
    assert links[0]['rel'] == 'noopener noreferrer'


def _assert_tag_with_class(html, tag_name, class_name):
    matches = [
        attrs
        for attrs in _find_start_tags(html, tag_name)
        if class_name in attrs.get('class', '').split()
    ]
    assert len(matches) >= 1


def _configure_github_sso_provider(settings):
    settings.SOCIALACCOUNT_PROVIDERS = {
        'openid_connect': {'APPS': []},
        'github': {
            'APPS': [{
                'provider_id': 'github',
                'name': 'GitHub',
                'client_id': 'test-client-id',
                'secret': 'test-secret',
            }],
            'SCOPE': ['user:email', 'read:user'],
        },
    }


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


def test_login_view_context_login_page_heading_defaults_to_original_heading(rf, settings):
    settings.MATHESAR_LOGIN_PAGE_TEXT = {}
    view = MathesarLoginView()
    view.setup(rf.get('/auth/login/'))
    ctx = view.get_context_data(form=view.get_form())
    assert ctx['login_page_heading'] == 'Log in to Mathesar'


def test_login_view_context_includes_login_page_copy_when_set(rf, settings):
    settings.MATHESAR_LOGIN_PAGE_TEXT = {
        'heading': 'Welcome to your Mathesar workspace',
        'body': 'Sign in to start working with your database.',
    }
    settings.MATHESAR_LOGIN_PAGE_BACKGROUND = CUSTOM_BACKGROUND

    view = MathesarLoginView()
    view.setup(rf.get('/auth/login/'))
    ctx = view.get_context_data(form=view.get_form())

    assert ctx['login_page_heading'] == 'Welcome to your Mathesar workspace'
    assert ctx['login_page_body'] == 'Sign in to start working with your database.'
    assert ctx['login_page_background'] == CUSTOM_BACKGROUND


@pytest.mark.django_db
def test_login_page_preserves_default_heading_and_logo(rf, settings):
    settings.MATHESAR_INSTANCE_NAME = 'Mathesar'
    settings.MATHESAR_AUTH_LOGO_URL = None
    settings.MATHESAR_LOGIN_PAGE_TEXT = {}
    settings.MATHESAR_LOGIN_PAGE_BACKGROUND = None

    html = _login_page_html(rf, settings)

    _assert_tag_with_class(html, 'body', 'auth-page')
    _assert_tag_with_class(html, 'div', 'auth-shell')
    _assert_tag_with_class(html, 'div', 'auth-page-frame')
    _assert_tag_with_class(html, 'div', 'auth-utility-bar')
    _assert_tag_with_class(html, 'a', 'auth-logo')
    _assert_tag_with_class(html, 'main', 'auth-card')
    _assert_tag_with_class(html, 'figure', 'auth-launch-plane')
    _assert_tag_with_class(html, 'svg', 'auth-flight-path')
    language_select = _find_start_tags(html, 'select', name='language')
    assert len(language_select) == 1
    assert language_select[0]['onchange'] == 'this.form.submit()'
    next_input = _find_start_tags(html, 'input', name='next', type='hidden')
    assert len(next_input) == 1
    assert next_input[0]['value'] == '/auth/login/'
    assert '<link rel="stylesheet" href="/static/css/auth.css" />' in html
    assert "showLoadingStatus('Logging In...');" in html
    assert 'Log in to Mathesar' in html
    assert '--auth-login-page-background' not in html
    logo = _find_start_tags(
        html,
        'img',
        src='/static/images/red-logo-with-text.svg',
    )
    assert len(logo) == 1
    assert logo[0]['alt'] == 'Mathesar Logo'
    assert logo[0]['title'] == 'Mathesar'


@pytest.mark.django_db
def test_login_page_renders_custom_background(rf, settings):
    settings.MATHESAR_LOGIN_PAGE_BACKGROUND = CUSTOM_BACKGROUND

    html = _login_page_html(rf, settings)

    assert f'--auth-login-page-background: {CUSTOM_BACKGROUND};' in html


@pytest.mark.django_db
def test_login_page_renders_top_level_custom_heading(rf, settings):
    settings.MATHESAR_LOGIN_PAGE_TEXT = {
        'heading': 'Welcome to your Mathesar workspace',
    }
    settings.MATHESAR_LOGIN_PAGE_BACKGROUND = None

    html = _login_page_html(rf, settings)

    assert 'Welcome to your Mathesar workspace' in html
    assert 'Log in to Mathesar' not in html


@pytest.mark.django_db
def test_login_page_renders_custom_body_as_plain_text(rf, settings):
    settings.MATHESAR_LOGIN_PAGE_TEXT = {
        'body': '<strong>Sign in to start working.</strong>',
    }
    settings.MATHESAR_LOGIN_PAGE_BACKGROUND = None

    html = _login_page_html(rf, settings)

    _assert_tag_with_class(html, 'p', 'auth-card-intro')
    assert '&lt;strong&gt;Sign in to start working.&lt;/strong&gt;' in html
    assert '<strong>Sign in to start working.</strong>' not in html


@pytest.mark.django_db
def test_login_page_renders_exact_locale_custom_copy(rf, settings):
    settings.MATHESAR_LOGIN_PAGE_TEXT = {
        'heading': 'Welcome to your Mathesar workspace',
        'body': 'Sign up or log in.',
        'translations': {
            'es': {
                'heading': 'Bienvenido a tu espacio de trabajo de Mathesar',
                'body': 'Regístrate o inicia sesión.',
            },
        },
    }

    html = _login_page_html(rf, settings, language_code='es')

    assert 'Bienvenido a tu espacio de trabajo de Mathesar' in html
    assert 'Regístrate o inicia sesión.' in html
    assert 'Welcome to your Mathesar workspace' not in html
    assert 'Sign up or log in.' not in html


@pytest.mark.django_db
def test_login_page_renders_base_language_custom_copy(rf, settings):
    settings.MATHESAR_LOGIN_PAGE_TEXT = {
        'heading': 'Welcome to your Mathesar workspace',
        'translations': {
            'es': {
                'heading': 'Bienvenido a tu espacio de trabajo de Mathesar',
            },
        },
    }

    html = _login_page_html(rf, settings, language_code='es-mx')

    assert 'Bienvenido a tu espacio de trabajo de Mathesar' in html
    assert 'Welcome to your Mathesar workspace' not in html


@pytest.mark.django_db
def test_login_page_uses_top_level_body_when_localized_body_is_missing(
        rf, settings
):
    settings.MATHESAR_LOGIN_PAGE_TEXT = {
        'heading': 'Welcome to your Mathesar workspace',
        'body': 'Sign up or log in.',
        'translations': {
            'es': {
                'heading': 'Bienvenido a tu espacio de trabajo de Mathesar',
            },
        },
    }

    html = _login_page_html(rf, settings, language_code='es')

    assert 'Bienvenido a tu espacio de trabajo de Mathesar' in html
    assert 'Sign up or log in.' in html


@pytest.mark.django_db
def test_login_page_renders_custom_auth_logo(rf, settings):
    settings.MATHESAR_INSTANCE_NAME = 'Mathesar Cloud'
    settings.MATHESAR_AUTH_LOGO_URL = CUSTOM_LOGO_URL
    settings.MATHESAR_LOGIN_PAGE_BACKGROUND = None

    html = _login_page_html(rf, settings)

    logo = _find_start_tags(html, 'img', src=CUSTOM_LOGO_URL)
    assert len(logo) == 1
    assert logo[0]['alt'] == 'Mathesar Cloud Logo'
    assert logo[0]['title'] == 'Mathesar Cloud'
    assert 'red-logo-with-text.svg' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_with_terms_and_privacy(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = TERMS_URL
    settings.MATHESAR_PRIVACY_POLICY_URL = PRIVACY_URL

    html = _login_page_html(rf, settings)

    _assert_tag_with_class(html, 'div', 'auth-legal-notice')
    assert 'By logging in, you agree to the' in html
    assert TERMS_LINK in html
    assert 'and acknowledge the' in html
    assert PRIVACY_LINK in html
    _assert_link_attrs(html, TERMS_URL)
    _assert_link_attrs(html, PRIVACY_URL)
    assert 'Terms of Service | Privacy Policy' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_with_terms_only(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = TERMS_URL
    settings.MATHESAR_PRIVACY_POLICY_URL = None

    html = _login_page_html(rf, settings)

    assert 'By logging in, you agree to the' in html
    assert TERMS_LINK in html
    _assert_link_attrs(html, TERMS_URL)
    assert 'Privacy Policy' not in html
    assert 'and acknowledge the' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_with_privacy_only(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = None
    settings.MATHESAR_PRIVACY_POLICY_URL = PRIVACY_URL

    html = _login_page_html(rf, settings)

    assert 'By logging in, you acknowledge the' in html
    assert PRIVACY_LINK in html
    _assert_link_attrs(html, PRIVACY_URL)
    assert 'Terms of Service' not in html
    assert 'agree to the' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_not_rendered_without_links(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = None
    settings.MATHESAR_PRIVACY_POLICY_URL = None

    html = _login_page_html(rf, settings)

    assert '<div class="auth-legal-notice">' not in html
    assert 'Terms of Service' not in html
    assert 'Privacy Policy' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_not_rendered_with_blank_links(rf, settings):
    settings.MATHESAR_TERMS_OF_SERVICE_URL = ''
    settings.MATHESAR_PRIVACY_POLICY_URL = ''

    html = _login_page_html(rf, settings)

    assert '<div class="auth-legal-notice">' not in html
    assert 'Terms of Service' not in html
    assert 'Privacy Policy' not in html


@pytest.mark.django_db
def test_login_page_legal_notice_renders_when_sso_is_required(rf, settings):
    settings.REQUIRE_SSO_LOGIN = True
    settings.MATHESAR_TERMS_OF_SERVICE_URL = TERMS_URL
    settings.MATHESAR_PRIVACY_POLICY_URL = PRIVACY_URL

    html = _login_page_html(rf, settings)

    assert 'name="username"' not in html
    assert 'name="password"' not in html
    _assert_tag_with_class(html, 'div', 'auth-legal-notice')
    assert 'By logging in, you agree to the' in html
    assert TERMS_LINK in html
    assert 'and acknowledge the' in html
    assert PRIVACY_LINK in html


@pytest.mark.django_db
def test_login_page_renders_cloud_configuration_when_sso_is_required(
        rf, settings
):
    settings.REQUIRE_SSO_LOGIN = True
    _configure_github_sso_provider(settings)
    settings.MATHESAR_INSTANCE_NAME = CUSTOM_INSTANCE_NAME
    settings.MATHESAR_AUTH_LOGO_URL = CUSTOM_LOGO_URL
    settings.MATHESAR_LOGIN_PAGE_TEXT = {
        'heading': CUSTOM_HEADING,
        'body': CUSTOM_BODY,
    }
    settings.MATHESAR_TERMS_OF_SERVICE_URL = TERMS_URL
    settings.MATHESAR_PRIVACY_POLICY_URL = PRIVACY_URL

    html = _login_page_html(rf, settings)

    assert 'name="username"' not in html
    assert 'name="password"' not in html
    assert CUSTOM_HEADING in html
    assert '&lt;strong&gt;Sign in to start working.&lt;/strong&gt;' in html
    assert '<strong>Sign in to start working.</strong>' not in html
    _assert_tag_with_class(html, 'div', 'auth-sso-providers')
    _assert_tag_with_class(html, 'div', 'auth-card-actions')
    assert 'Continue with GitHub' in html
    logo = _find_start_tags(html, 'img', src=CUSTOM_LOGO_URL)
    assert len(logo) == 1
    assert logo[0]['alt'] == 'Mathesar Cloud Logo'
    assert logo[0]['title'] == 'Mathesar Cloud'
    assert TERMS_LINK in html
    assert PRIVACY_LINK in html
    _assert_link_attrs(html, TERMS_URL)
    _assert_link_attrs(html, PRIVACY_URL)


@pytest.mark.django_db
def test_password_reset_page_uses_auth_shell(rf, settings, admin_user):
    html = _password_reset_page_html(rf, settings, admin_user)

    _assert_tag_with_class(html, 'body', 'auth-page')
    _assert_tag_with_class(html, 'main', 'auth-card')
    _assert_tag_with_class(html, 'div', 'auth-card-actions')
    assert 'Update Your Password' in html
    assert 'auth-launch-plane' not in html
    assert 'auth-flight-path' not in html
    assert 'mathesar-paper-airplane-transparent.png' not in html
    assert 'auth-legal-notice' not in html
