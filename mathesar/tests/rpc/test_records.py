"""
This file tests the record RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import records
from mathesar.models.users import User


def test_records_list(rf, monkeypatch):
    username = 'alice'
    password = 'pass1234'
    table_oid = 23457
    database_id = 2
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username=username, password=password)

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == username:
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_list_records(
            conn,
            _table_oid,
            limit=None,
            offset=None,
            order=None,
            filter=None,
            group=None,
    ):
        if _table_oid != table_oid:
            raise AssertionError('incorrect parameters passed')
        return {
            "count": 50123,
            "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
            "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
        }

    monkeypatch.setattr(records, 'connect', mock_connect)
    monkeypatch.setattr(records.record_select, 'list_records_from_table', mock_list_records)
    expect_records_list = {
        "count": 50123,
        "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
        "group": None,
        "preview_data": [],
        "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
    }
    actual_records_list = records.list_(
        table_oid=table_oid, database_id=database_id, request=request
    )
    assert actual_records_list == expect_records_list


def test_records_search(rf, monkeypatch):
    username = 'alice'
    password = 'pass1234'
    table_oid = 23457
    database_id = 2
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username=username, password=password)

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == username:
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_search_records(
            conn,
            _table_oid,
            search=[],
            limit=10,
    ):
        if _table_oid != table_oid:
            raise AssertionError('incorrect parameters passed')
        return {
            "count": 50123,
            "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
            "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
        }

    monkeypatch.setattr(records, 'connect', mock_connect)
    monkeypatch.setattr(records.record_select, 'search_records_from_table', mock_search_records)
    expect_records_list = {
        "count": 50123,
        "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
        "group": None,
        "preview_data": [],
        "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
    }
    actual_records_list = records.search(
        table_oid=table_oid, database_id=database_id, request=request
    )
    assert actual_records_list == expect_records_list
