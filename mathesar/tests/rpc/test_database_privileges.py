"""
This file tests the database_privileges RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
    mocked_exec_msar_func(mathesar/tests/conftest.py): Lets you patch the exec_msar_func() for testing.
"""
import json
from contextlib import contextmanager

from mathesar.rpc.databases import privileges
from mathesar.models.users import User


def test_database_privileges_set_for_roles(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(privileges, 'connect', mock_connect)
    expect_response = [
        {"role_oid": 12345, "direct": ["CONNECT"]},
        {"role_oid": 67890, "direct": ["CONNECT", "TEMPORARY"]}
    ]
    mocked_exec_msar_func.fetchone.return_value = [expect_response]
    actual_response = privileges.replace_for_roles(
        privileges=_privileges, database_id=_database_id, request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_response == expect_response
    assert call_args[2] == json.dumps(_privileges)


def test_transfer_db_ownership(rf, monkeypatch, mocked_exec_msar_func):
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
    expect_response = {
        'oid': 1988103,
        'name': 'mathesar',
        'owner_oid': _new_owner_oid,
        'current_role_priv': ['CONNECT', 'CREATE', 'TEMPORARY'],
        'current_role_owns': True
    }

    monkeypatch.setattr(privileges, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = [expect_response]
    actual_response = privileges.transfer_ownership(
        new_owner_oid=_new_owner_oid, database_id=_database_id, request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_response == expect_response
    assert call_args[2] == _new_owner_oid
