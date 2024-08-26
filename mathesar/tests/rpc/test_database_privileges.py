"""
This file tests the database_privileges RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import database_privileges
from mathesar.models.users import User


def test_database_privileges_set_for_roles(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _database_id = 2
    _privileges = [{"role_oid": 12345, "direct": ["CONNECT"]}]
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username=_username, password=_password)

    @contextmanager
    def mock_connect(database_id, user):
        if database_id == _database_id and user.username == _username:
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_replace_privileges(
            conn,
            privileges,
    ):
        if privileges != _privileges:
            raise AssertionError('incorrect parameters passed')
        return _privileges + [{"role_oid": 67890, "direct": ["CONNECT", "TEMPORARY"]}]

    monkeypatch.setattr(database_privileges, 'connect', mock_connect)
    monkeypatch.setattr(
        database_privileges,
        'replace_database_privileges_for_roles',
        mock_replace_privileges
    )
    expect_response = [
        {"role_oid": 12345, "direct": ["CONNECT"]},
        {"role_oid": 67890, "direct": ["CONNECT", "TEMPORARY"]}
    ]
    actual_response = database_privileges.replace_for_roles(
        privileges=_privileges, database_id=_database_id, request=request
    )
    assert actual_response == expect_response
