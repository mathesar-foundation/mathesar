"""
This file tests the data modeling RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import data_modeling
from mathesar.models.users import User


def test_data_modeling_add_foreign_key_column(rf, monkeypatch):
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
    monkeypatch.setattr(data_modeling.links_create, 'add_foreign_key_column', mock_add_fkey_col)
    data_modeling.add_foreign_key_column(
        column_name=_column_name,
        referrer_table_oid=_referrer_table_oid,
        referent_table_oid=_referent_table_oid,
        database_id=_database_id,
        request=request,
    )
