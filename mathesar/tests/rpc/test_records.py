"""
This file tests the record RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
    mocked_exec_msar_func(mathesar/tests/conftest.py): Lets you patch the exec_msar_func() for testing.
"""
import json
from contextlib import contextmanager

from mathesar.rpc import records
from mathesar.models.users import User


def test_records_list(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(records, 'connect', mock_connect)
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
    }
    mocked_exec_msar_func.fetchone.return_value = [expect_records_list]
    actual_records_list = records.list_(
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_records_list == expect_records_list
    assert call_args[2] == table_oid
    assert call_args[3] is None  # limit
    assert call_args[4] is None  # offset
    assert call_args[5] is None  # order
    assert call_args[6] is None  # filter
    assert call_args[7] is None  # group
    assert call_args[8] is True  # return_record_summaries
    assert call_args[9] == json.dumps({})  # summary template


def test_records_get(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(records, 'connect', mock_connect)
    expect_record = {
        "count": 1,
        "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
        "grouping": None,
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
    }
    mocked_exec_msar_func.fetchone.return_value = [expect_record]
    actual_record = records.get(
        record_id=record_id,
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_record == expect_record
    assert call_args[2] == table_oid
    assert call_args[3] == record_id
    assert call_args[4] is True  # return_record_summaries
    assert call_args[5] == json.dumps({})  # table_record_summary_templates


def test_records_add(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(records, 'connect', mock_connect)
    expect_record = {
        "results": [record_def],
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
    }
    mocked_exec_msar_func.fetchone.return_value = [expect_record]
    actual_record = records.add(
        record_def=record_def,
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_record == expect_record
    assert call_args[2] == table_oid
    assert call_args[3] == json.dumps(record_def)
    assert call_args[4] is True  # return_record_summaries
    assert call_args[5] == json.dumps({})  # table_record_summary_templates


def test_records_patch(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(records, 'connect', mock_connect)
    expect_record = {
        "results": [record_def | {"3": "another"}],
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
    }
    mocked_exec_msar_func.fetchone.return_value = [expect_record]
    actual_record = records.patch(
        record_def=record_def,
        record_id=record_id,
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        table_record_summary_templates=None,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_record == expect_record
    assert call_args[2] == table_oid
    assert call_args[3] == record_id
    assert call_args[4] == json.dumps(record_def)
    assert call_args[5] is True  # return_record_summaries
    assert call_args[6] == json.dumps({})  # table_record_summary_templates


def test_records_delete(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(records, 'connect', mock_connect)
    expect_result = 2
    mocked_exec_msar_func.fetchone.return_value = [expect_result]
    actual_result = records.delete(
        record_ids=record_ids, table_oid=table_oid, database_id=database_id, request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_result == expect_result
    assert call_args[2] == table_oid
    assert call_args[3] == json.dumps(record_ids)


def test_records_search(rf, monkeypatch, mocked_exec_msar_func):
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

    monkeypatch.setattr(records, 'connect', mock_connect)
    expect_records_list = {
        "count": 50123,
        "results": [{"1": "abcde", "2": 12345}, {"1": "fghij", "2": 67890}],
        "grouping": None,
        "linked_record_summaries": {"2": {"12345": "blkjdfslkj"}},
        "record_summaries": {"3": "abcde"},
        "query": 'SELECT mycol AS "1", anothercol AS "2" FROM mytable LIMIT 2',
    }
    mocked_exec_msar_func.fetchone.return_value = [expect_records_list]
    actual_records_list = records.search(
        table_oid=table_oid,
        database_id=database_id,
        return_record_summaries=True,
        request=request
    )
    call_args = mocked_exec_msar_func.call_args_list[0][0]
    assert actual_records_list == expect_records_list
    assert call_args[2] == table_oid
    assert call_args[3] == json.dumps([])  # search query
    assert call_args[4] == 10  # limit
    assert call_args[5] is True  # return_record_summaries
    assert call_args[6] == json.dumps({})  # table_record_summary_templates
