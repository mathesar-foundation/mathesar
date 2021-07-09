import itertools
from collections import Counter

import pytest
from sqlalchemy import select

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


def test_get_group_counts_limit_ordering(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    limit = 50
    order_by = [{"field": "numeric", "direction": "desc", "nullslast": True}]
    group_by = [filter_sort.c.numeric]
    counts = records.get_group_counts(filter_sort, engine, group_by, limit=limit,
                                      order_by=order_by)
    assert len(counts) == 50
    for i in range(1, 100):
        if i > 50:
            assert (i,) in counts
        else:
            assert (i,) not in counts


def test_get_group_counts_limit_offset_ordering(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    offset = 25
    limit = 50
    order_by = [{"field": "numeric", "direction": "desc", "nullslast": True}]
    group_by = [filter_sort.c.numeric]
    counts = records.get_group_counts(filter_sort, engine, group_by, limit=limit,
                                      offset=offset, order_by=order_by)
    assert len(counts) == 50
    for i in range(1, 100):
        if i > 25 and i <= 75:
            assert (i,) in counts
        else:
            assert (i,) not in counts


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
