import json
from unittest.mock import patch

from django.test import Client
from django.test.utils import override_settings

from mathesar.middleware import HealthCheckMiddleware

_PASSED_THROUGH = object()


def _middleware():
    return HealthCheckMiddleware(lambda request: _PASSED_THROUGH)


def test_passes_through_non_health_paths(rf):
    assert _middleware()(rf.get('/some/other/path')) is _PASSED_THROUGH


def test_liveness_returns_ok(rf):
    for path in ('/healthz/live', '/healthz/live/'):
        response = _middleware()(rf.get(path))
        assert response.status_code == 200
        assert json.loads(response.content) == {"status": "ok"}


def test_liveness_does_not_touch_the_database(rf):
    # Liveness must never hit the DB; a DB failure must not affect it.
    with patch('mathesar.middleware.connection') as mock_connection:
        response = _middleware()(rf.get('/healthz/live/'))
    assert response.status_code == 200
    mock_connection.cursor.assert_not_called()


def test_rejects_non_get(rf):
    response = _middleware()(rf.post('/healthz/live/'))
    assert response.status_code == 405


def test_readiness_returns_ok_when_db_reachable(rf):
    for path in ('/healthz/ready', '/healthz/ready/'):
        response = _middleware()(rf.get(path))
        assert response.status_code == 200
        assert json.loads(response.content) == {"status": "ok"}


def test_readiness_returns_503_when_db_check_fails(rf):
    with patch(
        'mathesar.middleware.transaction.atomic',
        side_effect=Exception('database unreachable'),
    ):
        response = _middleware()(rf.get('/healthz/ready/'))
    assert response.status_code == 503
    assert json.loads(response.content) == {"status": "unavailable"}


@override_settings(DEBUG=False, ALLOWED_HOSTS=['mathesar.example.com'])
def test_endpoints_work_under_restricted_allowed_hosts():
    client = Client()
    assert client.get('/healthz/live/', HTTP_HOST='localhost').status_code == 200
    assert client.get('/healthz/ready/', HTTP_HOST='10.1.2.3').status_code == 200
