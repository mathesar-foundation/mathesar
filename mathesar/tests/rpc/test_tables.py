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


def test_tables_get(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 1964474
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

    def mock_table_get(_table_oid, conn):
        if _table_oid != table_oid:
            raise AssertionError('incorrect parameters passed')
        return {
            'oid': table_oid,
            'name': 'Authors',
            'schema': 2200,
            'description': 'a description on the authors table.'
        }
    monkeypatch.setattr(tables, 'connect', mock_connect)
    monkeypatch.setattr(tables, 'get_table', mock_table_get)
    expect_table_list = {
        'oid': table_oid,
        'name': 'Authors',
        'schema': 2200,
        'description': 'a description on the authors table.'
    }
    actual_table_list = tables.get(table_oid=1964474, database_id=11, request=request)
    assert actual_table_list == expect_table_list


def test_tables_delete(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 1964474
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

    def mock_drop_table(_table_oid, conn, cascade):
        if _table_oid != table_oid:
            raise AssertionError('incorrect parameters passed')
        return 'public."Table 0"'

    monkeypatch.setattr(tables, 'connect', mock_connect)
    monkeypatch.setattr(tables, 'drop_table_from_database', mock_drop_table)
    deleted_table = tables.delete(table_oid=1964474, database_id=11, request=request)
    assert deleted_table == 'public."Table 0"'


def test_tables_add(rf, monkeypatch):
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

    def mock_table_add(_schema_oid, conn):
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
    monkeypatch.setattr(tables, 'create_table_on_database', mock_table_add)
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
    actual_table_list = tables.add(schema_oid=2200, database_id=11, request=request)
    assert actual_table_list == expect_table_list