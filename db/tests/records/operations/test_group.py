import itertools
from collections import Counter

import pytest
from sqlalchemy import select
from sqlalchemy_filters import apply_sort, apply_filters

from db.records.operations.group import get_group_counts, append_distinct_tuples_to_filter, get_distinct_tuple_values
from db.records.operations.select import get_records
from db.records.exceptions import BadGroupFormat, GroupFieldNotFound


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


def test_get_group_counts_str_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = ["varchar"]
    counts = get_group_counts(filter_sort, engine, group_by)
    assert len(counts) == 101
    assert ("string1",) in counts


def test_get_group_counts_col_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = [filter_sort.c.varchar]
    counts = get_group_counts(filter_sort, engine, group_by)
    assert len(counts) == 101
    assert ("string1",) in counts


def test_get_group_counts_mixed_str_col_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = ["varchar", filter_sort.c.numeric]
    counts = get_group_counts(filter_sort, engine, group_by)
    assert len(counts) == 101
    assert ("string1", 1) in counts


limit_offset_test_list = [
    (limit, offset)
    for limit in [None, 0, 25, 50, 100]
    for offset in [None, 0, 25, 50, 100]
]


@pytest.mark.parametrize("limit,offset", limit_offset_test_list)
def test_get_group_counts_limit_offset_ordering(roster_table_obj, limit, offset):
    roster, engine = roster_table_obj
    order_by = [{"field": "Grade", "direction": "desc", "nullslast": True}]
    group_by = [roster.c["Grade"]]
    counts = get_group_counts(roster, engine, group_by, limit=limit, offset=offset, order_by=order_by)
    query = select(group_by[0])
    query = apply_sort(query, order_by)
    with engine.begin() as conn:
        all_records = conn.execute(query).fetchall()
    if limit is None:
        end = None
    elif offset is None:
        end = limit
    else:
        end = limit + offset
    limit_offset_records = all_records[offset:end]
    values_to_count = set([record["Grade"] for record in limit_offset_records])

    manual_all_count = Counter(all_records).items()
    manual_count = {
        k: v for k, v in manual_all_count if int(k[0]) in values_to_count
    }

    assert len(counts) == len(manual_count)
    for value, count in manual_count.items():
        assert value in counts
        assert counts[value] == count


count_values_test_list = itertools.chain(*[
    itertools.combinations([
        "Student Name",
        "Student Email",
        "Teacher Email",
        "Subject",
        "Grade"
    ], i) for i in range(1, 5)
])


@pytest.mark.parametrize("group_by", count_values_test_list)
def test_get_group_counts_count_values(roster_table_obj, group_by):
    roster, engine = roster_table_obj
    counts = get_group_counts(roster, engine, group_by)

    cols = [roster.c[f] for f in group_by]
    with engine.begin() as conn:
        all_records = conn.execute(select(*cols)).fetchall()
    manual_count = Counter(all_records)

    for value, count in manual_count.items():
        assert value in counts
        assert counts[value] == count


filter_values_test_list = itertools.chain(*[
    itertools.combinations([
        {"field": "Student Name", "op": "ge", "value": "Test Name"},
        {"field": "Student Email", "op": "le", "value": "Test Email"},
        {"field": "Teacher Email", "op": "like", "value": "%gmail.com"},
        {"field": "Subject", "op": "eq", "value": "Non-Existent Subject"},
        {"field": "Grade", "op": "ne", "value": 99}
    ], i) for i in range(1, 3)
])


@pytest.mark.parametrize("filter_by", filter_values_test_list)
def test_get_group_counts_filter_values(roster_table_obj, filter_by):
    roster, engine = roster_table_obj
    group_by = ["Student Name"]
    counts = get_group_counts(roster, engine, group_by, filters=filter_by)

    cols = [roster.c[f] for f in group_by]
    query = select(*cols)
    query = apply_filters(query, filter_by)
    with engine.begin() as conn:
        all_records = conn.execute(query).fetchall()
    manual_count = Counter(all_records)

    for value, count in manual_count.items():
        assert value in counts
        assert counts[value] == count


exceptions_test_list = [
    ("string", BadGroupFormat),
    ({"dictionary": ""}, BadGroupFormat),
    ([{"field": "varchar"}], BadGroupFormat),
    (["non_existent_field"], GroupFieldNotFound),
]


@pytest.mark.parametrize("group_by,exception", exceptions_test_list)
def test_get_group_counts_exceptions(filter_sort_table_obj, group_by, exception):
    filter_sort, engine = filter_sort_table_obj
    with pytest.raises(exception):
        get_group_counts(filter_sort, engine, group_by)
