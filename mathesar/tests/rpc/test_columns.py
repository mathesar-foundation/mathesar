"""
This file tests the column listing function.

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
        if _database_id == 2 and user.username == 'alice':
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
                'has_dependents': True
            }, {
                'id': 2, 'name': 'numcol', 'type': 'numeric',
                'default': {'value': "'8'::numeric", 'is_dynamic': False},
                'nullable': True,
                'description': 'My super numeric column',
                'primary_key': False,
                'type_options': {'scale': None, 'precision': None},
                'has_dependents': False
            }, {
                'id': 4, 'name': 'numcolmod', 'type': 'numeric',
                'default': None,
                'nullable': True, 'description': None, 'primary_key': False,
                'type_options': {'scale': 3, 'precision': 5},
                'has_dependents': False
            }, {
                'id': 8, 'name': 'ivlcolmod', 'type': 'interval',
                'default': None,
                'nullable': True, 'description': None, 'primary_key': False,
                'type_options': {'fields': 'day to second'},
                'has_dependents': False
            }, {
                'id': 10, 'name': 'arrcol', 'type': '_array',
                'default': None,
                'nullable': True, 'description': None, 'primary_key': False,
                'type_options': {'item_type': 'character varying', 'length': 3},
                'has_dependents': False
            },
        ]

    def mock_display_options(_database_id, _table_oid, attnums, user):
        if (
                database_id != 2
                or table_oid != 23457
                or attnums != (1, 2, 4, 8, 10)
                or user.username != 'alice'
        ):
            raise AssertionError("incorrect parameters passed")
        return [
            {
                'id': 4,
                'use_grouping': 'true',
                'number_format': 'english',
                'show_as_percentage': False,
                'maximum_fraction_digits': 2,
                'minimum_fraction_digits': 2
            }
        ]
    monkeypatch.setattr(columns, 'connect', mock_connect)
    monkeypatch.setattr(columns, 'get_column_info_for_table', mock_column_info)
    monkeypatch.setattr(columns, 'get_raw_display_options', mock_display_options)
    expect_col_list = {
        'column_info': (
            {
                'id': 1, 'name': 'id', 'type': 'integer',
                'default': {'value': 'identity', 'is_dynamic': True},
                'nullable': False, 'description': None, 'primary_key': True,
                'type_options': None,
                'has_dependents': True
            }, {
                'id': 2, 'name': 'numcol', 'type': 'numeric',
                'default': {'value': "'8'::numeric", 'is_dynamic': False},
                'nullable': True,
                'description': 'My super numeric column',
                'primary_key': False,
                'type_options': None,
                'has_dependents': False
            }, {
                'id': 4, 'name': 'numcolmod', 'type': 'numeric',
                'default': None,
                'nullable': True, 'description': None, 'primary_key': False,
                'type_options': {'scale': 3, 'precision': 5},
                'has_dependents': False
            }, {
                'id': 8, 'name': 'ivlcolmod', 'type': 'interval',
                'default': None,
                'nullable': True, 'description': None, 'primary_key': False,
                'type_options': {'fields': 'day to second'},
                'has_dependents': False
            }, {
                'id': 10, 'name': 'arrcol', 'type': '_array',
                'default': None,
                'nullable': True, 'description': None, 'primary_key': False,
                'type_options': {'item_type': 'character varying', 'length': 3},
                'has_dependents': False
            }
        ),
        'display_options': [
            {
                'id': 4,
                'use_grouping': 'true',
                'number_format': 'english',
                'show_as_percentage': False,
                'maximum_fraction_digits': 2,
                'minimum_fraction_digits': 2
            }
        ]
    }
    actual_col_list = columns.list_(table_oid=23457, database_id=2, request=request)
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

    monkeypatch.setattr(columns, 'connect', mock_connect)
    monkeypatch.setattr(columns, 'alter_columns_in_table', mock_column_alter)
    actual_result = columns.patch(
        column_data_list=column_data_list,
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    assert actual_result == 1


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

    monkeypatch.setattr(columns, 'connect', mock_connect)
    monkeypatch.setattr(columns, 'drop_columns_from_table', mock_column_drop)
    actual_result = columns.delete(
        column_attnums=column_attnums,
        table_oid=table_oid,
        database_id=database_id,
        request=request
    )
    assert actual_result == 3
