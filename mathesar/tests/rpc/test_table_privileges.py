"""
This file tests the table_privileges RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
    mocked_exec_msar_func(mathesar/tests/conftest.py): Lets you patch the exec_msar_func() for testing.
"""
import json
from contextlib import contextmanager

from mathesar.rpc.tables import privileges as table_privileges
from mathesar.models.users import User


def test_table_privileges_list_direct(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(table_privileges, 'connect', mock_connect)
    expect_response = _privileges
    mocked_exec_msar_func.fetchone.return_value = [expect_response]
    actual_response = table_privileges.list_direct(
        table_oid=_table_oid, database_id=_database_id, request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_response == expect_response
    assert call_args[2] == _table_oid


def test_table_privileges_replace_for_roles(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(table_privileges, 'connect', mock_connect)
    expect_response = [
        {"role_oid": 12345, "direct": ["SELECT", "UPDATE", "DELETE"]},
        {"role_oid": 67890, "direct": ["INSERT", "SELECT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]}
    ]
    mocked_exec_msar_func.fetchone.return_value = [expect_response]
    actual_response = table_privileges.replace_for_roles(
        privileges=_privileges, table_oid=_table_oid, database_id=_database_id,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_response == expect_response
    assert call_args[2] == _table_oid
    assert call_args[3] == json.dumps(_privileges)


def test_transfer_table_ownership(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(table_privileges, 'connect', mock_connect)
    table_privileges.transfer_ownership(
        table_oid=_table_oid, new_owner_oid=_new_owner_oid, database_id=_database_id, request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert call_args[2] == _table_oid
    assert call_args[3] == _new_owner_oid
