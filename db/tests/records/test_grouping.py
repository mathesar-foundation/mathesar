import itertools
from collections import Counter

import pytest
from sqlalchemy import select
from sqlalchemy_filters import apply_sort

from db import records
from db.records import GroupFieldNotFound, BadGroupFormat


def test_get_group_counts_str_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = ["varchar"]
    counts = records.get_group_counts(filter_sort, engine, group_by)
    assert len(counts) == 101
    assert ("string1",) in counts


def test_get_group_counts_col_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = [filter_sort.c.varchar]
    counts = records.get_group_counts(filter_sort, engine, group_by)
    assert len(counts) == 101
    assert ("string1",) in counts


def test_get_group_counts_mixed_str_col_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = ["varchar", filter_sort.c.numeric]
    counts = records.get_group_counts(filter_sort, engine, group_by)
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
    counts = records.get_group_counts(roster, engine, group_by, limit=limit,
                                      offset=offset, order_by=order_by)

    query = select(group_by[0])
    query = apply_sort(query, order_by)
    with engine.begin() as conn:
        all_records = list(conn.execute(query))
    if limit is None:
        end = None
    elif offset is None:
        end = limit
    else:
        end = limit + offset
    limit_offset_records = all_records[offset:end]
    manual_count = Counter(limit_offset_records)

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
    counts = records.get_group_counts(roster, engine, group_by)

    cols = [roster.c[f] for f in group_by]
    with engine.begin() as conn:
        all_records = conn.execute(select(*cols)).fetchall()
    manual_count = Counter(all_records)

    for key, value in counts.items():
        assert manual_count[key] == value


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
        records.get_group_counts(filter_sort, engine, group_by)
