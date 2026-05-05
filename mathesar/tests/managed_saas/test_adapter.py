"""
Tests for the managed-SaaS social-account adapter.

The adapter enforces that every sign-up has a verified email from the
provider, sets username = email, and populates full_name. Unverified
or missing-email sign-ups are rejected with an ImmediateHttpResponse.
"""
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from allauth.core.exceptions import ImmediateHttpResponse

from mathesar.managed_saas.adapter import SaasSocialAccountAdapter
from mathesar.models.users import User


def _make_sociallogin(email, verified=True, name=None):
    """Build a minimal sociallogin double for adapter tests."""
    user = User(email=email or '', username='', full_name=None)
    email_addresses = []
    if email:
        email_addresses.append(
            SimpleNamespace(email=email, verified=verified, primary=True)
        )
    return SimpleNamespace(
        user=user,
        email_addresses=email_addresses,
        account=SimpleNamespace(extra_data={'name': name} if name else {}),
    )


def test_pre_social_login_rejects_missing_email(rf):
    request = rf.get('/auth/login/')
    request._messages = MagicMock()
    sociallogin = _make_sociallogin(email=None)

    with pytest.raises(ImmediateHttpResponse):
        SaasSocialAccountAdapter().pre_social_login(request, sociallogin)


def test_pre_social_login_rejects_unverified_email(rf):
    request = rf.get('/auth/login/')
    request._messages = MagicMock()
    sociallogin = _make_sociallogin(email='alice@example.com', verified=False)

    with pytest.raises(ImmediateHttpResponse):
        SaasSocialAccountAdapter().pre_social_login(request, sociallogin)


def test_pre_social_login_passes_verified_email(rf, monkeypatch):
    request = rf.get('/auth/login/')
    request._messages = MagicMock()
    sociallogin = _make_sociallogin(email='Alice@Example.com', verified=True)

    # Bypass allauth's parent implementation so we don't pull in DB lookups.
    monkeypatch.setattr(
        'allauth.socialaccount.adapter.DefaultSocialAccountAdapter.pre_social_login',
        lambda self, request, sociallogin: None,
    )

    SaasSocialAccountAdapter().pre_social_login(request, sociallogin)

    # Email is normalized to lowercase before being passed to allauth.
    assert sociallogin.user.email == 'alice@example.com'


def test_populate_user_sets_username_and_full_name(rf, monkeypatch):
    request = rf.get('/auth/login/')
    sociallogin = _make_sociallogin(email='alice@example.com', verified=True)

    # Stub the parent so the test stays focused on this adapter's logic.
    def fake_parent_populate(self, request, sociallogin, data):
        return sociallogin.user
    monkeypatch.setattr(
        'allauth.socialaccount.adapter.DefaultSocialAccountAdapter.populate_user',
        fake_parent_populate,
    )

    data = {'email': 'alice@example.com', 'name': 'Alice Liddell'}
    user = SaasSocialAccountAdapter().populate_user(request, sociallogin, data)

    assert user.username == 'alice@example.com'
    assert user.email == 'alice@example.com'
    assert user.full_name == 'Alice Liddell'


def test_populate_user_falls_back_to_first_last_when_name_absent(rf, monkeypatch):
    request = rf.get('/auth/login/')
    sociallogin = _make_sociallogin(email='bob@example.com', verified=True)

    def fake_parent_populate(self, request, sociallogin, data):
        return sociallogin.user
    monkeypatch.setattr(
        'allauth.socialaccount.adapter.DefaultSocialAccountAdapter.populate_user',
        fake_parent_populate,
    )

    data = {'email': 'bob@example.com', 'first_name': 'Bob', 'last_name': 'Marley'}
    user = SaasSocialAccountAdapter().populate_user(request, sociallogin, data)

    assert user.full_name == 'Bob Marley'


def test_populate_user_leaves_full_name_unset_when_no_name_data(rf, monkeypatch):
    request = rf.get('/auth/login/')
    sociallogin = _make_sociallogin(email='carol@example.com', verified=True)

    def fake_parent_populate(self, request, sociallogin, data):
        return sociallogin.user
    monkeypatch.setattr(
        'allauth.socialaccount.adapter.DefaultSocialAccountAdapter.populate_user',
        fake_parent_populate,
    )

    data = {'email': 'carol@example.com'}
    user = SaasSocialAccountAdapter().populate_user(request, sociallogin, data)

    assert user.full_name is None
