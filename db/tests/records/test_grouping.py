import itertools
from collections import Counter

import pytest
from sqlalchemy import select

from db import records


def test_get_group_counts_str_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = ["varchar"]
    counts = records.get_group_counts(filter_sort, engine, group_by=group_by)
    assert len(counts) == 101
    assert "string1" in counts


def test_get_group_counts_col_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = [filter_sort.c.varchar]
    counts = records.get_group_counts(filter_sort, engine, group_by=group_by)
    assert len(counts) == 101
    assert "string1" in counts


def test_get_group_counts_mixed_str_col_field(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    group_by = ["varchar", filter_sort.c.numeric]
    counts = records.get_group_counts(filter_sort, engine, group_by=group_by)
    assert len(counts) == 101
    assert ("string1", 1) in counts


def test_get_group_counts_limit_ordering(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    limit = 50
    order_by = [{"field": "numeric", "direction": "desc", "nullslast": True}]
    group_by = [filter_sort.c.numeric]
    counts = records.get_group_counts(filter_sort, engine, limit=limit,
                                      order_by=order_by, group_by=group_by)
    assert len(counts) == 50
    for i in range(1, 100):
        if i > 50:
            assert i in counts
        else:
            assert i not in counts


def test_get_group_counts_limit_offset_ordering(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    offset = 25
    limit = 50
    order_by = [{"field": "numeric", "direction": "desc", "nullslast": True}]
    group_by = [filter_sort.c.numeric]
    counts = records.get_group_counts(filter_sort, engine, limit=limit, offset=offset,
                                      order_by=order_by, group_by=group_by)
    assert len(counts) == 50
    for i in range(1, 100):
        if i > 25 and i <= 75:
            assert i in counts
        else:
            assert i not in counts


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
    print(group_by)
    counts = records.get_group_counts(roster, engine, group_by=group_by)

    cols = [roster.c[f] for f in group_by]
    with engine.begin() as conn:
        all_records = conn.execute(select(*cols)).fetchall()
    manual_count = Counter(all_records)

    for key, value in counts.items():
        # The counter uses tuples as keys
        if type(key) is not tuple:
            key = (key,)
        assert manual_count[key] == value
