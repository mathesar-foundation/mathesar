"""
This file tests the column listing function.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    admin_client(pytest): Lets you monkeypatch an object for testing.
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
