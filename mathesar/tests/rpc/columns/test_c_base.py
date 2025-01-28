"""
This file tests the column RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
    mocked_exec_msar_func(mathesar/tests/conftest.py): Lets you patch the exec_msar_func() for testing.
"""
import json
from contextlib import contextmanager

from mathesar.rpc import columns
from mathesar.models.users import User


def test_columns_list(rf, monkeypatch, mocked_exec_msar_func):
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 23457
    database_id = 2

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    expect_col_list = [
        {
            'id': 1, 'name': 'id', 'type': 'integer',
            'default': {'value': 'identity', 'is_dynamic': True},
            'nullable': False, 'description': None, 'primary_key': True,
            'type_options': None,
            'has_dependents': True,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE'],
            'valid_target_types': ['text']
        }, {
            'id': 2, 'name': 'numcol', 'type': 'numeric',
            'default': {'value': "'8'::numeric", 'is_dynamic': False},
            'nullable': True,
            'description': 'My super numeric column',
            'primary_key': False,
            'type_options': None,
            'has_dependents': False,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE'],
            'valid_target_types': ['text']
        }, {
            'id': 4, 'name': 'numcolmod', 'type': 'numeric',
            'default': None,
            'nullable': True, 'description': None, 'primary_key': False,
            'type_options': {'scale': 3, 'precision': 5},
            'has_dependents': False,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE'],
            'valid_target_types': ['text']
        }, {
            'id': 8, 'name': 'ivlcolmod', 'type': 'interval',
            'default': None,
            'nullable': True, 'description': None, 'primary_key': False,
            'type_options': {'fields': 'day to second'},
            'has_dependents': False,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE'],
            'valid_target_types': ['text']
        }, {
            'id': 10, 'name': 'arrcol', 'type': '_array',
            'default': None,
            'nullable': True, 'description': None, 'primary_key': False,
            'type_options': {'item_type': 'character varying', 'length': 3},
            'has_dependents': False,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE'],
            'valid_target_types': None
        }
    ]
    mocked_exec_msar_func.fetchone.return_value = [expect_col_list]
    actual_col_list = columns.list_(table_oid=23457, database_id=database_id, request=request)
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_col_list == expect_col_list
    assert call_args[2] == table_oid


def test_columns_patch(rf, monkeypatch, mocked_exec_msar_func):
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 23457
    database_id = 2
    column_data_list = [{"id": 3, "name": "newname"}]

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == 2 and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = [1]
    actual_result = columns.patch(
        column_data_list=column_data_list,
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    transformed_column_data = [{'attnum': 3, 'name': 'newname'}]
    assert actual_result == 1
    assert call_args[2] == table_oid
    assert call_args[3] == json.dumps(transformed_column_data)


def test_columns_add(rf, monkeypatch, mocked_exec_msar_func):
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 23457
    database_id = 2
    column_data_list = [{"id": 3, "name": "newname"}]

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == 2 and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = [[3, 4]]
    actual_result = columns.add(
        column_data_list=column_data_list,
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    transformed_column_data = [
        {
            'name': 'newname', 'type': {'name': 'character varying', 'options': {}},
            'not_null': False, 'default': None, 'description': None
        }
    ]
    assert actual_result == [3, 4]
    assert call_args[2] == table_oid
    assert call_args[3] == json.dumps(transformed_column_data)
    assert call_args[4] is False


def test_columns_delete(rf, monkeypatch, mocked_exec_msar_func):
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 23457
    database_id = 2
    column_attnums = [2, 3, 8]

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == 2 and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = [3]
    actual_result = columns.delete(
        column_attnums=column_attnums,
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_result == 3
    assert call_args[2] == table_oid
    assert call_args[3:6] == tuple(column_attnums)
