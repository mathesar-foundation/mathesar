"""
This file tests the table_privileges RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc.tables import privileges as table_privileges
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


def test_table_privileges_replace_for_roles(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _table_oid = 654321
    _database_id = 2
    _privileges = [{"role_oid": 12345, "direct": ["SELECT", "UPDATE", "DELETE"]}]
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
            table_oid,
            privileges,
    ):
        if privileges != _privileges or table_oid != _table_oid:
            raise AssertionError('incorrect parameters passed')
        return _privileges + [{
            "role_oid": 67890,
            "direct": [
                "INSERT",
                "SELECT",
                "UPDATE",
                "DELETE",
                "TRUNCATE",
                "REFERENCES",
                "TRIGGER"
            ]}]

    monkeypatch.setattr(table_privileges, 'connect', mock_connect)
    monkeypatch.setattr(
        table_privileges,
        'replace_table_privileges_for_roles',
        mock_replace_privileges
    )
    expect_response = [
        {"role_oid": 12345, "direct": ["SELECT", "UPDATE", "DELETE"]},
        {"role_oid": 67890, "direct": ["INSERT", "SELECT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]}
    ]
    actual_response = table_privileges.replace_for_roles(
        privileges=_privileges, table_oid=_table_oid, database_id=_database_id,
        request=request
    )
    assert actual_response == expect_response


def test_transfer_table_ownership(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _database_id = 2
    _new_owner_oid = 443123
    _table_oid = 2573196
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

    def mock_tansfer_table_ownership(
            table_oid,
            new_owner_oid,
            conn
    ):
        if table_oid != _table_oid and new_owner_oid != _new_owner_oid:
            raise AssertionError('incorrect parameters passed')
        return {
            'oid': table_oid,
            'name': 'x',
            'schema': 2200,
            'owner_oid': 2573031,
            'description': None,
            'current_role_owns': True,
            'current_role_priv': [
                'SELECT',
                'INSERT',
                'UPDATE',
                'DELETE',
                'TRUNCATE',
                'REFERENCES',
                'TRIGGER'
            ]
        }

    monkeypatch.setattr(table_privileges, 'connect', mock_connect)
    monkeypatch.setattr(
        table_privileges,
        'transfer_table_ownership',
        mock_tansfer_table_ownership
    )
    table_privileges.transfer_ownership(
        table_oid=_table_oid, new_owner_oid=_new_owner_oid, database_id=_database_id, request=request
    )
