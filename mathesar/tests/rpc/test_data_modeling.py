"""
This file tests the data modeling RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import data_modeling
from mathesar.models.users import User


def test_add_foreign_key_column(rf, monkeypatch):
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

    def mock_add_fkey_col(
            conn,
            column_name,
            referrer_table_oid,
            referent_table_oid,
            unique_link=False
    ):
        if (
                column_name != _column_name
                or referent_table_oid != _referent_table_oid
                or referrer_table_oid != _referrer_table_oid
        ):
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    monkeypatch.setattr(data_modeling.links, 'add_foreign_key_column', mock_add_fkey_col)
    data_modeling.add_foreign_key_column(
        column_name=_column_name,
        referrer_table_oid=_referrer_table_oid,
        referent_table_oid=_referent_table_oid,
        database_id=_database_id,
        request=request,
    )


def test_add_mapping_table(rf, monkeypatch):
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

    def mock_add_mapping_table(
            conn,
            schema_oid,
            table_name,
            mapping_columns,
    ):
        if (
                schema_oid != _schema_oid
                or table_name != _table_name
                or mapping_columns != _mapping_columns
        ):
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    monkeypatch.setattr(data_modeling.links, 'add_mapping_table', mock_add_mapping_table)
    data_modeling.add_mapping_table(
        table_name=_table_name,
        mapping_columns=_mapping_columns,
        schema_oid=_schema_oid,
        database_id=_database_id,
        request=request,
    )


def test_suggest_types(rf, monkeypatch):
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

    def mock_suggest_types(conn, table_oid):
        if table_oid != _table_oid:
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    monkeypatch.setattr(data_modeling.infer_types, 'infer_table_column_data_types', mock_suggest_types)
    data_modeling.suggest_types(
        table_oid=_table_oid,
        database_id=_database_id,
        request=request,
    )


def test_split_table(rf, monkeypatch):
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

    def mock_split_table(
        conn,
        table_oid,
        column_attnums,
        extracted_table_name,
        relationship_fk_column_name
    ):
        if (
            table_oid != _table_oid
            and column_attnums != _column_attnums
            and extracted_table_name != _extracted_table_name
            and relationship_fk_column_name != _relationship_fk_column_name
        ):
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    monkeypatch.setattr(data_modeling.split, 'split_table', mock_split_table)
    data_modeling.split_table(
        table_oid=_table_oid,
        column_attnums=_column_attnums,
        extracted_table_name=_extracted_table_name,
        relationship_fk_column_name=_relationship_fk_column_name,
        database_id=_database_id,
        request=request
    )


def test_move_columns(rf, monkeypatch):
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

    def mock_move_columns(
        conn,
        source_table_oid,
        target_table_oid,
        move_column_attnums
    ):
        if (
            source_table_oid != _source_table_oid
            and target_table_oid != _target_table_oid
            and move_column_attnums != _move_column_attnums
        ):
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(data_modeling, 'connect', mock_connect)
    monkeypatch.setattr(data_modeling.move_cols, 'move_columns_to_referenced_table', mock_move_columns)
    data_modeling.move_columns(
        source_table_oid=_source_table_oid,
        target_table_oid=_target_table_oid,
        move_column_attnums=_move_column_attnums,
        database_id=_database_id,
        request=request
    )
