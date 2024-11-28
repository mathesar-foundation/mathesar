"""
This file tests the data modeling RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
    mocked_exec_msar_func(mathesar/tests/conftest.py): Lets you patch the exec_msar_func() for testing.
"""
import json
from contextlib import contextmanager

from mathesar.rpc import data_modeling
from mathesar.models.users import User


def test_add_foreign_key_column(rf, monkeypatch, mocked_exec_msar_func):
    _username = 'alice'
    _password = 'pass1234'
    _column_name = 'new_fkey_col'
    _referrer_table_oid = 23457
    _referent_table_oid = 67890
    _database_id = 2
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

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    data_modeling.add_foreign_key_column(
        column_name=_column_name,
        referrer_table_oid=_referrer_table_oid,
        referent_table_oid=_referent_table_oid,
        database_id=_database_id,
        request=request,
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert call_args[2] == _column_name
    assert call_args[3] == _referrer_table_oid
    assert call_args[4] == _referent_table_oid
    assert call_args[5] is False  # Make link one-to-one?


def test_add_mapping_table(rf, monkeypatch, mocked_exec_msar_func):
    _username = 'alice'
    _password = 'pass1234'
    _schema_oid = 1234
    _table_name = 't1_t2'
    _mapping_columns = [
        {"column_name": "t1_id", "referent_table_oid": 11111},
        {"column_name": "t2_id", "referent_table_oid": 22222},
    ]
    _database_id = 2
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

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    data_modeling.add_mapping_table(
        table_name=_table_name,
        mapping_columns=_mapping_columns,
        schema_oid=_schema_oid,
        database_id=_database_id,
        request=request,
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert call_args[2] == _schema_oid
    assert call_args[3] == _table_name
    assert call_args[4] == json.dumps(_mapping_columns)


def test_suggest_types(rf, monkeypatch, mocked_exec_msar_func):
    _username = 'alice'
    _password = 'pass1234'
    _table_oid = 12345
    _database_id = 2
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

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    data_modeling.suggest_types(
        table_oid=_table_oid,
        database_id=_database_id,
        request=request,
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert call_args[2] == _table_oid


def test_split_table(rf, monkeypatch, mocked_exec_msar_func):
    _username = 'alice'
    _password = 'pass1234'
    _table_oid = 12345
    _database_id = 2
    _column_attnums = [2, 3, 4]
    _extracted_table_name = 'extracted_table'
    _relationship_fk_column_name = 'fk_col'
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

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    mocked_exec_msar_func.fetchone.return_value = [[12345, 6]]
    data_modeling.split_table(
        table_oid=_table_oid,
        column_attnums=_column_attnums,
        extracted_table_name=_extracted_table_name,
        relationship_fk_column_name=_relationship_fk_column_name,
        database_id=_database_id,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert call_args[2] == _table_oid
    assert call_args[3] == _column_attnums
    assert call_args[4] == _extracted_table_name
    assert call_args[5] == _relationship_fk_column_name


def test_move_columns(rf, monkeypatch, mocked_exec_msar_func):
    _username = 'alice'
    _password = 'pass1234'
    _source_table_oid = 12345
    _target_table_oid = 67891
    _move_column_attnums = [2, 3, 4]
    _database_id = 2
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

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    data_modeling.move_columns(
        source_table_oid=_source_table_oid,
        target_table_oid=_target_table_oid,
        move_column_attnums=_move_column_attnums,
        database_id=_database_id,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert call_args[2] == _source_table_oid
    assert call_args[3] == _target_table_oid
    assert call_args[4] == _move_column_attnums
