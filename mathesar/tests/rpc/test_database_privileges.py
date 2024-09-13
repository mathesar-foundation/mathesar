"""
This file tests the database_privileges RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc.databases import privileges
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

    monkeypatch.setattr(privileges, 'connect', mock_connect)
    monkeypatch.setattr(
        privileges,
        'replace_database_privileges_for_roles',
        mock_replace_privileges
    )
    expect_response = [
        {"role_oid": 12345, "direct": ["CONNECT"]},
        {"role_oid": 67890, "direct": ["CONNECT", "TEMPORARY"]}
    ]
    actual_response = privileges.replace_for_roles(
        privileges=_privileges, database_id=_database_id, request=request
    )
    assert actual_response == expect_response


def test_transfer_db_ownership(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _database_id = 2
    _new_owner_oid = 443123
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

    def mock_tansfer_db_ownership(
            new_owner_oid,
            conn
    ):
        if new_owner_oid != _new_owner_oid:
            raise AssertionError('incorrect parameters passed')
        return {
            'oid': 1988103,
            'name': 'mathesar',
            'owner_oid': new_owner_oid,
            'current_role_priv': ['CONNECT', 'CREATE', 'TEMPORARY'],
            'current_role_owns': True
        }

    monkeypatch.setattr(privileges, 'connect', mock_connect)
    monkeypatch.setattr(
        privileges,
        'transfer_database_ownership',
        mock_tansfer_db_ownership
    )
    privileges.transfer_ownership(
        new_owner_oid=_new_owner_oid, database_id=_database_id, request=request
    )
