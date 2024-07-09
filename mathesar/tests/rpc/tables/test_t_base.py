"""
This file tests the table RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from decimal import Decimal
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
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'get_table_info', mock_table_info)
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
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'get_table', mock_table_get)
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

    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'drop_table_from_database', mock_drop_table)
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

    def mock_table_add(table_name, _schema_oid, conn, column_data_list, constraint_data_list, comment):
        if _schema_oid != schema_oid:
            raise AssertionError('incorrect parameters passed')
        return 1964474
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'create_table_on_database', mock_table_add)
    actual_table_oid = tables.add(table_name='newtable', schema_oid=2200, database_id=11, request=request)
    assert actual_table_oid == 1964474


def test_tables_patch(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 1964474
    database_id = 11
    table_data_dict = {
        "name": "newtabname",
        "description": "this is a description",
        "columns": {}
    }

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_table_patch(_table_oid, _table_data_dict, conn):
        if _table_oid != table_oid and _table_data_dict != table_data_dict:
            raise AssertionError('incorrect parameters passed')
        return 'newtabname'
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'alter_table_on_database', mock_table_patch)
    altered_table_name = tables.patch(
        table_oid=1964474,
        table_data_dict={
            "name": "newtabname",
            "description": "this is a description",
            "columns": {}
        },
        database_id=11,
        request=request
    )
    assert altered_table_name == 'newtabname'


def test_tables_import(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    schema_oid = 2200
    data_file_id = 10
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

    def mock_table_import(_data_file_id, table_name, _schema_oid, conn, comment):
        if _schema_oid != schema_oid and _data_file_id != data_file_id:
            raise AssertionError('incorrect parameters passed')
        return 1964474
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'import_csv', mock_table_import)
    imported_table_oid = tables.import_(
        data_file_id=10,
        table_name='imported_table',
        schema_oid=2200,
        database_id=11,
        request=request
    )
    assert imported_table_oid == 1964474


def test_tables_preview(rf, monkeypatch):
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

    def mock_table_preview(_table_oid, columns, conn, limit):
        if _table_oid != table_oid:
            raise AssertionError('incorrect parameters passed')
        return [
            {'id': 1, 'length': Decimal('2.0')},
            {'id': 2, 'length': Decimal('3.0')},
            {'id': 3, 'length': Decimal('4.0')},
            {'id': 4, 'length': Decimal('5.22')}
        ]
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'get_preview', mock_table_preview)
    records = tables.get_import_preview(
        table_oid=1964474,
        columns=[{'attnum': 2, 'type': {'name': 'numeric', 'options': {'precision': 3, 'scale': 2}}}],
        database_id=11,
        request=request
    )
    assert records == [
        {'id': 1, 'length': Decimal('2.0')},
        {'id': 2, 'length': Decimal('3.0')},
        {'id': 3, 'length': Decimal('4.0')},
        {'id': 4, 'length': Decimal('5.22')}
    ]


def test_list_joinable(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 2254329
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

    def mock_list_joinable_tables(_table_oid, conn, max_depth):
        if _table_oid != table_oid:
            raise AssertionError('incorrect parameters passed')
        return [
            {
                'base': 2254329,
                'target': 2254334,
                'join_path': [[[2254329, 2], [2254334, 1]]],
                'fkey_path': [['2254406', False]],
                'depth': 1,
                'multiple_results': False
            },
            {
                'base': 2254329,
                'target': 2254350,
                'join_path': [[[2254329, 3], [2254350, 1]]],
                'fkey_path': [['2254411', False]],
                'depth': 1,
                'multiple_results': False
            },
            {
                'base': 2254329,
                'target': 2254321,
                'join_path': [[[2254329, 2], [2254334, 1]], [[2254334, 5], [2254321, 1]]],
                'fkey_path': [['2254406', False], ['2254399', False]],
                'depth': 2,
                'multiple_results': False
            },
            {
                'base': 2254329,
                'target': 2254358,
                'join_path': [
                    [[2254329, 2], [2254334, 1]],
                    [[2254334, 5], [2254321, 1]],
                    [[2254321, 11], [2254358, 1]]
                ],
                'fkey_path': [['2254406', False], ['2254399', False], ['2254394', False]],
                'depth': 3,
                'multiple_results': False
            },
            {
                'base': 2254329,
                'target': 2254313,
                'join_path': [
                    [[2254329, 2], [2254334, 1]],
                    [[2254334, 5], [2254321, 1]],
                    [[2254321, 10], [2254313, 1]]
                ],
                'fkey_path': [['2254406', False], ['2254399', False], ['2254389', False]],
                'depth': 3,
                'multiple_results': False
            }
        ]
    expected_list = [
        {
            'base': 2254329,
            'target': 2254334,
            'join_path': [[[2254329, 2], [2254334, 1]]],
            'fkey_path': [['2254406', False]],
            'depth': 1,
            'multiple_results': False
        },
        {
            'base': 2254329,
            'target': 2254350,
            'join_path': [[[2254329, 3], [2254350, 1]]],
            'fkey_path': [['2254411', False]],
            'depth': 1,
            'multiple_results': False
        },
        {
            'base': 2254329,
            'target': 2254321,
            'join_path': [[[2254329, 2], [2254334, 1]], [[2254334, 5], [2254321, 1]]],
            'fkey_path': [['2254406', False], ['2254399', False]],
            'depth': 2,
            'multiple_results': False
        },
        {
            'base': 2254329,
            'target': 2254358,
            'join_path': [
                [[2254329, 2], [2254334, 1]],
                [[2254334, 5], [2254321, 1]],
                [[2254321, 11], [2254358, 1]]
            ],
            'fkey_path': [['2254406', False], ['2254399', False], ['2254394', False]],
            'depth': 3,
            'multiple_results': False
        },
        {
            'base': 2254329,
            'target': 2254313,
            'join_path': [
                [[2254329, 2], [2254334, 1]],
                [[2254334, 5], [2254321, 1]],
                [[2254321, 10], [2254313, 1]]
            ],
            'fkey_path': [['2254406', False], ['2254399', False], ['2254389', False]],
            'depth': 3,
            'multiple_results': False
        }
    ]
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'list_joinable_tables', mock_list_joinable_tables)
    actual_list = tables.list_joinable(table_oid=2254329, database_id=11, max_depth=3, request=request)
    assert expected_list == actual_list
