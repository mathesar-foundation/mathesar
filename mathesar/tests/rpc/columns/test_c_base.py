"""
This file tests the column RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
    mocked_exec_msar_func(mathesar/tests/conftest.py): Lets you patch the exec_msar_func() for testing.
"""
import json
from contextlib import contextmanager

import pytest

from mathesar.rpc import columns
from mathesar.models.users import User
from mathesar.models.base import TableMetaData


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
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE']
        }, {
            'id': 2, 'name': 'numcol', 'type': 'numeric',
            'default': {'value': "'8'::numeric", 'is_dynamic': False},
            'nullable': True,
            'description': 'My super numeric column',
            'primary_key': False,
            'type_options': None,
            'has_dependents': False,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE']
        }, {
            'id': 4, 'name': 'numcolmod', 'type': 'numeric',
            'default': None,
            'nullable': True, 'description': None, 'primary_key': False,
            'type_options': {'scale': 3, 'precision': 5},
            'has_dependents': False,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE']
        }, {
            'id': 8, 'name': 'ivlcolmod', 'type': 'interval',
            'default': None,
            'nullable': True, 'description': None, 'primary_key': False,
            'type_options': {'fields': 'day to second'},
            'has_dependents': False,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE']
        }, {
            'id': 10, 'name': 'arrcol', 'type': '_array',
            'default': None,
            'nullable': True, 'description': None, 'primary_key': False,
            'type_options': {'item_type': 'character varying', 'length': 3},
            'has_dependents': False,
            'current_role_priv': ['SELECT', 'INSERT', 'UPDATE']
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


def test_add_primary_key_column(rf, monkeypatch, mocked_exec_msar_func):
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 23457
    database_id = 2

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == 2 and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_set_meta_data(table_oid, metadata, _database_id):
        assert table_oid == 23457
        assert metadata == {"mathesar_added_pkey_attnum": 3}
        assert _database_id == 2

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    monkeypatch.setattr(columns.base, 'set_table_meta_data', mock_set_meta_data)
    mocked_exec_msar_func.fetchone.return_value = [3]
    columns.add_primary_key_column(
        pkey_type="IDENTITY",
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert call_args[2] == table_oid
    assert call_args[3] == "IDENTITY"
    assert call_args[4] is False  # This should be the default
    assert call_args[5] == 'id'  # This should be the default

    columns.add_primary_key_column(
        pkey_type="IDENTITY",
        table_oid=table_oid,
        database_id=database_id,
        drop_existing_pkey_column=True,
        name="Identity",
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[1][0]
    assert call_args[2] == table_oid
    assert call_args[3] == "IDENTITY"
    assert call_args[4] is True
    assert call_args[5] == 'Identity'


def test_columns_patch_prevent_rename_default_pk(rf, monkeypatch, mocked_exec_msar_func):
    """Test that renaming the default Mathesar ID column raises ValidationError."""
    from modernrpc.core import REQUEST_KEY
    from modernrpc.exceptions import RPCException

    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 23457
    database_id = 2
    pk_attnum = 1

    # Create a mock TableMetaData with the default PK column set
    mock_table_metadata = type('MockTableMetaData', (), {
        'mathesar_added_pkey_attnum': pk_attnum,
        'oid': table_oid,
    })()

    @contextmanager
    def mock_connect(_database_id, user):
        try:
            yield True
        finally:
            pass

    def mock_get_table_metadata(**kwargs):
        if kwargs.get('oid') == table_oid:
            return mock_table_metadata
        raise TableMetaData.DoesNotExist()

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    monkeypatch.setattr(TableMetaData.objects, 'get', mock_get_table_metadata)

    # Try to rename the default PK column - should raise ValidationError wrapped in RPCException
    with pytest.raises(RPCException) as exc_info:
        columns.patch(
            column_data_list=[{
                'id': pk_attnum,
                'name': 'new_id_name',  # Attempting to rename
            }],
            table_oid=table_oid,
            database_id=database_id,
            **{REQUEST_KEY: request}
        )

    # Verify the error message contains the expected validation message
    assert "Cannot rename default Mathesar ID column" in str(exc_info.value)
