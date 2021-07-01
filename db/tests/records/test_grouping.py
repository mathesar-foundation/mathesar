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
