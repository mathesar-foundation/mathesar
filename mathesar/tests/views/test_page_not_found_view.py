"""
Tests for the custom 404 handler (page_not_found_view).

Verifies that:
- Non-logged-in users get a 404 (not 500) when requesting a nonexistent path.
- Authenticated users also get a 404.
- Anonymous users receive only minimal context (no sensitive data).
- Authenticated users receive full context.
"""
from unittest.mock import MagicMock

import pytest
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.test.utils import override_settings

from mathesar.views import get_common_data, page_not_found_view

NONEXISTENT_PATH = '/nonexistent-path-xyz/'
TEST_STORAGES = {
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}


def _make_request(rf):
    request = rf.get(NONEXISTENT_PATH)
    request.LANGUAGE_CODE = settings.LANGUAGE_CODE
    return request


@override_settings(MATHESAR_MODE='DEVELOPMENT', STORAGES=TEST_STORAGES)
def test_404_anonymous_user(rf):
    request = _make_request(rf)
    request.user = AnonymousUser()
    response = page_not_found_view(request, None)
    assert response.status_code == 404


@override_settings(MATHESAR_MODE='DEVELOPMENT', STORAGES=TEST_STORAGES)
@pytest.mark.django_db
def test_404_authenticated_user(rf, admin_user):
    request = _make_request(rf)
    request.user = admin_user
    response = page_not_found_view(request, None)
    assert response.status_code == 404


def test_get_common_data_dispatches_to_anonymous(rf):
    request = rf.get(NONEXISTENT_PATH)
    request.user = MagicMock(is_authenticated=False, is_anonymous=True)
    data = get_common_data(request)
    assert data['routing_context'] == 'anonymous'
    assert 'user' not in data
    assert 'internal_db' not in data
    assert 'databases' not in data
    assert 'servers' not in data


@pytest.mark.django_db
def test_get_common_data_dispatches_to_authorized(rf, admin_user):
    request = rf.get(NONEXISTENT_PATH)
    request.user = admin_user
    data = get_common_data(request)
    assert data['routing_context'] == 'normal'
    assert data['user'] is not None
    assert 'internal_db' in data
    assert isinstance(data['databases'], list)
