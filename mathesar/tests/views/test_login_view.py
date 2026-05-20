"""
Tests for the MathesarLoginView's behavior under SSO-only mode.

Fixtures:
    rf(pytest-django): Provides a Django RequestFactory.
    settings(pytest-django): Lets tests temporarily override Django settings.
"""
from mathesar.views.users.login import MathesarLoginView


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
