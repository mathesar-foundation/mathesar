"""
This file tests the column RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import columns
from mathesar.models.users import User


def test_columns_list(rf, monkeypatch):
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

    def mock_column_info(_table_oid, conn):
        if _table_oid != table_oid:
            raise AssertionError('incorrect parameters passed')
        return [
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
                'type_options': {'scale': None, 'precision': None},
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
            },
        ]

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    monkeypatch.setattr(columns.base, 'get_column_info_for_table', mock_column_info)
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
    actual_col_list = columns.list_(table_oid=23457, database_id=database_id, request=request)
    assert actual_col_list == expect_col_list


def test_columns_patch(rf, monkeypatch):
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

    def mock_column_alter(_table_oid, _column_data_list, conn):
        if _table_oid != table_oid or _column_data_list != column_data_list:
            raise AssertionError('incorrect parameters passed')
        return 1

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    monkeypatch.setattr(columns.base, 'alter_columns_in_table', mock_column_alter)
    actual_result = columns.patch(
        column_data_list=column_data_list,
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    assert actual_result == 1


def test_columns_add(rf, monkeypatch):
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

    def mock_column_create(_table_oid, _column_data_list, conn):
        if _table_oid != table_oid or _column_data_list != column_data_list:
            raise AssertionError('incorrect parameters passed')
        return [3, 4]

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    monkeypatch.setattr(columns.base, 'add_columns_to_table', mock_column_create)
    actual_result = columns.add(
        column_data_list=column_data_list,
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    assert actual_result == [3, 4]


def test_columns_delete(rf, monkeypatch):
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

    def mock_column_drop(_table_oid, _column_attnums, conn):
        if _table_oid != table_oid or _column_attnums != column_attnums:
            raise AssertionError('incorrect parameters passed')
        return 3

    monkeypatch.setattr(columns.base, 'connect', mock_connect)
    monkeypatch.setattr(columns.base, 'drop_columns_from_table', mock_column_drop)
    actual_result = columns.delete(
        column_attnums=column_attnums,
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    assert actual_result == 3
