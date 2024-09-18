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
            return_record_summaries=False,
    ):
        if _table_oid != table_oid or return_record_summaries is False:
            raise AssertionError('incorrect parameters passed')
        return {
            "count": 50123,
            "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
            "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
            "grouping": {
                "columns": [2],
                "groups": [
                    {"id": 3, "count": 8, "results_eq": {"1": "lsfj", "2": 3422}}
                ]
            },
            "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
            "record_summaries": {"3": "abcde"}
        }

    monkeypatch.setattr(records, 'connect', mock_connect)
    monkeypatch.setattr(records.record_select, 'list_records_from_table', mock_list_records)
    expect_records_list = {
        "count": 50123,
        "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
        "grouping": {
            "columns": [2],
            "groups": [
                {"id": 3, "count": 8, "results_eq": {"1": "lsfj", "2": 3422}}
            ]
        },
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
        "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
    }
    actual_records_list = records.list_(
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    assert actual_records_list == expect_records_list


def test_records_get(rf, monkeypatch):
    username = 'alice'
    password = 'pass1234'
    table_oid = 23457
    database_id = 2
    record_id = 2342
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

    def mock_get_record(
            conn,
            _record_id,
            _table_oid,
            return_record_summaries=False,
    ):
        if _table_oid != table_oid or _record_id != record_id or return_record_summaries is False:
            raise AssertionError('incorrect parameters passed')
        return {
            "count": 1,
            "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
            "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
            "grouping": None,
            "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
            "record_summaries": {"3": "abcde"},
        }

    monkeypatch.setattr(records, 'connect', mock_connect)
    monkeypatch.setattr(records.record_select, 'get_record_from_table', mock_get_record)
    expect_record = {
        "count": 1,
        "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
        "grouping": None,
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
        "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
    }
    actual_record = records.get(
        record_id=record_id,
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    assert actual_record == expect_record


def test_records_add(rf, monkeypatch):
    username = 'alice'
    password = 'pass1234'
    table_oid = 23457
    database_id = 2
    record_def = {"1": "arecord"}
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

    def mock_add_record(
            conn,
            _record_def,
            _table_oid,
            return_record_summaries=False,
    ):
        if _table_oid != table_oid or _record_def != record_def or return_record_summaries is False:
            raise AssertionError('incorrect parameters passed')
        return {
            "results": [_record_def],
            "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
            "record_summaries": {"3": "abcde"},
        }

    monkeypatch.setattr(records, 'connect', mock_connect)
    monkeypatch.setattr(records.record_insert, 'add_record_to_table', mock_add_record)
    expect_record = {
        "results": [record_def],
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
    }
    actual_record = records.add(
        record_def=record_def,
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    assert actual_record == expect_record


def test_records_patch(rf, monkeypatch):
    username = 'alice'
    password = 'pass1234'
    record_id = 243
    table_oid = 23457
    database_id = 2
    record_def = {"2": "arecord"}
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

    def mock_patch_record(
            conn,
            _record_def,
            _record_id,
            _table_oid,
            return_record_summaries=False,
    ):
        if (
                _table_oid != table_oid
                or _record_def != record_def
                or _record_id != record_id
                or return_record_summaries is False
        ):
            raise AssertionError('incorrect parameters passed')
        return {
            "results": [_record_def | {"3": "another"}],
            "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
            "record_summaries": {"3": "abcde"},
        }

    monkeypatch.setattr(records, 'connect', mock_connect)
    monkeypatch.setattr(records.record_update, 'patch_record_in_table', mock_patch_record)
    expect_record = {
        "results": [record_def | {"3": "another"}],
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
    }
    actual_record = records.patch(
        record_def=record_def,
        record_id=record_id,
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    assert actual_record == expect_record


def test_records_delete(rf, monkeypatch):
    username = 'alice'
    password = 'pass1234'
    table_oid = 23457
    database_id = 2
    record_ids = [2342, 321]
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

    def mock_delete_records(
            conn,
            _record_ids,
            _table_oid,
    ):
        if _table_oid != table_oid or _record_ids != record_ids:
            raise AssertionError('incorrect parameters passed')
        return 2

    monkeypatch.setattr(records, 'connect', mock_connect)
    monkeypatch.setattr(records.record_delete, 'delete_records_from_table', mock_delete_records)
    expect_result = 2
    actual_result = records.delete(
        record_ids=record_ids, table_oid=table_oid, database_id=database_id, request=request
    )
    assert actual_result == expect_result


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
            return_record_summaries=False,
    ):
        if _table_oid != table_oid or return_record_summaries is False:
            raise AssertionError('incorrect parameters passed')
        return {
            "count": 50123,
            "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
            "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
            "record_summaries": {"3": "abcde"},
            "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
        }

    monkeypatch.setattr(records, 'connect', mock_connect)
    monkeypatch.setattr(records.record_select, 'search_records_from_table', mock_search_records)
    expect_records_list = {
        "count": 50123,
        "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
        "grouping": None,
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
        "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
    }
    actual_records_list = records.search(
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    assert actual_records_list == expect_records_list
