"""
This file tests the table RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import tables
from mathesar.models.users import User


def test_tables_list(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    schema_oid = 2200
    database_id = 11

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_table_info(_schema_oid, conn):
        if _schema_oid != schema_oid:
            raise AssertionError('incorrect parameters passed')
        return [
            {
                'oid': 17408,
                'name': 'Authors',
                'schema': schema_oid,
                'description': 'a description on the authors table.'
            },
            {
                'oid': 17809,
                'name': 'Books',
                'schema': schema_oid,
                'description': None
            }
        ]
    monkeypatch.setattr(tables, 'connect', mock_connect)
    monkeypatch.setattr(tables, 'get_table_info', mock_table_info)
    expect_table_list = [
        {
            'oid': 17408,
            'name': 'Authors',
            'schema': schema_oid,
            'description': 'a description on the authors table.'
        },
        {
            'oid': 17809,
            'name': 'Books',
            'schema': schema_oid,
            'description': None
        }
    ]
    actual_table_list = tables.list_(schema_oid=2200, database_id=11, request=request)
    assert actual_table_list == expect_table_list
