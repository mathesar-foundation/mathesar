import pytest

from db.records.operations.group import append_distinct_tuples_to_filter, get_distinct_tuple_values
from db.records.operations.select import get_records


def test_get_records_gets_all_records(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = get_records(roster, engine)
    assert len(record_list) == 1000


def test_get_records_gets_limited_records(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = get_records(roster, engine, limit=10)
    assert len(record_list) == 10


def test_get_records_gets_limited_offset_records(roster_table_obj):
    roster, engine = roster_table_obj
    base_records = get_records(roster, engine, limit=10)
    offset_records = get_records(roster, engine, limit=10, offset=5)
    assert len(offset_records) == 10 and offset_records[0] == base_records[5]


def test_get_distinct_tuple_values_length(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        roster.columns["Student Number"],
        roster.columns["Student Email"],
    ]
    record_list = get_distinct_tuple_values(
        column_list, engine
    )
    assert len(record_list) == 259


def test_get_distinct_tuple_values_distinct(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        roster.columns["Student Number"],
        roster.columns["Student Email"],
    ]
    record_list = get_distinct_tuple_values(
        column_list, engine
    )
    for i in range(len(record_list) - 1):
        assert record_list[i] != record_list[i + 1]


def test_get_distinct_tuple_values_raises_when_no_table(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    with pytest.raises(AssertionError):
        get_distinct_tuple_values(
            column_list, engine
        )


def test_get_distinct_tuple_values_with_string_column_input(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    record_list = get_distinct_tuple_values(
        column_list, engine, table=roster,
    )
    assert len(record_list) == 259


def test_get_distinct_tuple_values_limit(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    record_list = get_distinct_tuple_values(
        column_list, engine, table=roster, limit=10
    )
    assert len(record_list) == 10


def test_get_distinct_tuple_values_offset(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    record_list_base = get_distinct_tuple_values(
        column_list, engine, table=roster, limit=20
    )
    record_list_offset = get_distinct_tuple_values(
        column_list, engine, table=roster, limit=10, offset=10
    )
    assert record_list_offset == record_list_base[10:]


def test_get_distinct_tuple_values_feeds_get_records(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    distinct_tuples = get_distinct_tuple_values(
        column_list, engine, table=roster, limit=2
    )
    filter_list = append_distinct_tuples_to_filter(distinct_tuples[0])
    record_list = get_records(
        roster, engine, filters=filter_list
    )
    assert all(
        [
            record[1] == distinct_tuples[0][0][1]
            and record[3] == distinct_tuples[0][1][1]
            for record in record_list
        ]
    )
