"""
This file tests the table_privileges RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import table_privileges
from mathesar.models.users import User


def test_table_privileges_list_direct(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _database_id = 2
    _table_oid = 123456
    _privileges = [
        {
            "role_oid": 12345,
            "direct": [
                "INSERT",
                "SELECT",
                "UPDATE",
                "DELETE",
                "TRUNCATE",
                "REFERENCES",
                "TRIGGER"]
        }
    ]
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
            table_oid,
            conn,
    ):
        if table_oid != _table_oid:
            raise AssertionError('incorrect parameters passed')
        return _privileges

    monkeypatch.setattr(table_privileges, 'connect', mock_connect)
    monkeypatch.setattr(
        table_privileges,
        'list_table_privileges',
        mock_list_privileges
    )
    expect_response = _privileges
    actual_response = table_privileges.list_direct(
        table_oid=_table_oid, database_id=_database_id, request=request
    )
    assert actual_response == expect_response
