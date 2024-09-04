"""
This file tests the schema_privileges RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc.schemas import privileges as schema_privileges
from mathesar.models.users import User


def test_schema_privileges_list_direct(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _database_id = 2
    _schema_oid = 123456
    _privileges = [{"role_oid": 12345, "direct": ["USAGE", "CREATE"]}]
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

    def mock_list_privileges(
            schema_oid,
            conn,
    ):
        if schema_oid != _schema_oid:
            raise AssertionError('incorrect parameters passed')
        return _privileges

    monkeypatch.setattr(schema_privileges, 'connect', mock_connect)
    monkeypatch.setattr(
        schema_privileges,
        'list_schema_privileges',
        mock_list_privileges
    )
    expect_response = _privileges
    actual_response = schema_privileges.list_direct(
        schema_oid=_schema_oid, database_id=_database_id, request=request
    )
    assert actual_response == expect_response


def test_schema_privileges_replace_for_roles(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _schema_oid = 654321
    _database_id = 2
    _privileges = [{"role_oid": 12345, "direct": ["USAGE"]}]
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
            schema_oid,
            privileges,
    ):
        if privileges != _privileges or schema_oid != _schema_oid:
            raise AssertionError('incorrect parameters passed')
        return _privileges + [{"role_oid": 67890, "direct": ["USAGE", "CREATE"]}]

    monkeypatch.setattr(schema_privileges, 'connect', mock_connect)
    monkeypatch.setattr(
        schema_privileges,
        'replace_schema_privileges_for_roles',
        mock_replace_privileges
    )
    expect_response = [
        {"role_oid": 12345, "direct": ["USAGE"]},
        {"role_oid": 67890, "direct": ["USAGE", "CREATE"]}
    ]
    actual_response = schema_privileges.replace_for_roles(
        privileges=_privileges, schema_oid=_schema_oid, database_id=_database_id,
        request=request
    )
    assert actual_response == expect_response
