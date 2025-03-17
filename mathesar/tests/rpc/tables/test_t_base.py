"""
This file tests the table RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
    mocked_exec_msar_func(mathesar/tests/conftest.py): Lets you patch the exec_msar_func() for testing.
"""
import json
from decimal import Decimal
from contextlib import contextmanager

from mathesar.rpc import tables
from mathesar.models.users import User


def test_tables_list(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(tables.base, 'connect', mock_connect)
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
    mocked_exec_msar_func.fetchone.return_value = [expect_table_list]
    actual_table_list = tables.list_(schema_oid=2200, database_id=11, request=request)
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_table_list == expect_table_list
    assert call_args[2] == schema_oid


def test_tables_get(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    expect_table_list = {
        'oid': table_oid,
        'name': 'Authors',
        'schema': 2200,
        'description': 'a description on the authors table.'
    }
    mocked_exec_msar_func.fetchone.return_value = [expect_table_list]
    actual_table_list = tables.get(table_oid=1964474, database_id=11, request=request)
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_table_list == expect_table_list
    assert call_args[2] == table_oid


def test_tables_delete(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = ['public."Table 0"']
    deleted_table = tables.delete(table_oid=1964474, database_id=11, request=request)
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert deleted_table == 'public."Table 0"'
    assert call_args[2] == table_oid
    assert call_args[3] is False


def test_tables_add(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = [{"oid": 1964474, "name": "newtable"}]
    actual_table_info = tables.add(table_name='newtable', schema_oid=2200, database_id=11, request=request)
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_table_info == {"oid": 1964474, "name": "newtable"}
    assert call_args[2] == schema_oid
    assert call_args[3] == 'newtable'
    assert call_args[4] == json.dumps({})
    assert call_args[5] == json.dumps([])
    assert call_args[6] == json.dumps([])
    assert call_args[7] is None
    assert call_args[8] is None


def test_tables_patch(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = ['newtabname']
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
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert altered_table_name == 'newtabname'
    assert call_args[2] == table_oid
    assert call_args[3] == json.dumps(table_data_dict)


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

    def mock_set_meta_data(table_oid, metadata, _database_id):
        assert table_oid == 1964474
        assert metadata == {"mathesar_added_pkey_attnum": 1}
        assert _database_id == 11

    def mock_table_import(_user, _data_file_id, table_name, _schema_oid, conn, comment):
        if (
            _user != request.user
            and _schema_oid != schema_oid
            and _data_file_id != data_file_id
        ):
            raise AssertionError('incorrect parameters passed')
        return {"oid": 1964474, "name": "imported_table", "pkey_column_attnum": 1}
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    monkeypatch.setattr(tables.base, 'set_table_meta_data', mock_set_meta_data)
    monkeypatch.setattr(tables.base, 'copy_datafile_to_table', mock_table_import)
    imported_table_info = tables.import_(
        data_file_id=10,
        table_name='imported_table',
        schema_oid=2200,
        database_id=11,
        request=request
    )
    assert imported_table_info == {
        "oid": 1964474, "name": "imported_table", "renamed_columns": None
    }


def test_tables_preview(rf, monkeypatch, mocked_exec_msar_func):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 1964474
    database_id = 11
    column_list = [{'id': 2, 'type': 'numeric', 'type_options': {'precision': 3, 'scale': 2}}]

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    expected_records_list = [
        {'id': 1, 'length': Decimal('2.0')},
        {'id': 2, 'length': Decimal('3.0')},
        {'id': 3, 'length': Decimal('4.0')},
        {'id': 4, 'length': Decimal('5.22')}
    ]
    mocked_exec_msar_func.fetchone.return_value = [expected_records_list]
    records = tables.get_import_preview(
        table_oid=1964474,
        columns=column_list,
        database_id=11,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    transformed_col_list = [
        {
            'attnum': 2, 'type': {'name': 'numeric', 'options': {'precision': 3, 'scale': 2}}
        }
    ]
    assert records == expected_records_list
    assert call_args[2] == table_oid
    assert call_args[3] == json.dumps(transformed_col_list)
    assert call_args[4] == 20


def test_list_joinable(rf, monkeypatch, mocked_exec_msar_func):
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

    expected_dict = {
        'joinable_tables': [
            {
                'base': 2254329,
                'depth': 1,
                'target': 2254334,
                'fkey_path': [[2254406, False]],
                'join_path': [[[2254329, 2], [2254334, 1]]],
                'multiple_results': False
            },
            {
                'base': 2254329,
                'depth': 1,
                'target': 2254350,
                'fkey_path': [[2254411, False]],
                'join_path': [[[2254329, 3], [2254350, 1]]],
                'multiple_results': False
            }],
        'target_table_info': {
            '2254334': {
                'name': 'Items',
                'columns': {
                    '1': {'name': 'id', 'type': 'integer'},
                    '2': {'name': 'Barcode', 'type': 'text'},
                    '3': {'name': 'Acquisition Date', 'type': 'date'},
                    '5': {'name': 'Book', 'type': 'integer'}
                }
            },
            '2254350': {
                'name': 'Patrons',
                'columns': {
                    '1': {'name': 'id', 'type': 'integer'},
                    '2': {'name': 'First Name', 'type': 'text'},
                    '3': {'name': 'Last Name', 'type': 'text'}
                }
            }
        }
    }
    monkeypatch.setattr(tables.base, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = [expected_dict]
    actual_dict = tables.list_joinable(table_oid=2254329, database_id=11, max_depth=1, request=request)
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert expected_dict == actual_dict
    assert call_args[2] == 1
    assert call_args[3] == table_oid
