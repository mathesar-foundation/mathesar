import itertools
from collections import Counter

import pytest
from sqlalchemy import select, Column
from sqlalchemy_filters import apply_sort, apply_filters

from db.records.operations import group
from db.records.operations.select import get_records
from db.records import exceptions as rec_exc


@pytest.fixture
def roster_distinct_setup(roster_table_obj):
    roster, engine = roster_table_obj
    input_cols = ['Student Number', 'Student Email']
    gb = group.GroupBy(column_list=input_cols)
    grouping_columns = gb.get_validated_group_by_columns(roster)
    sel = group._get_distinct_group_select(roster, grouping_columns)
    with engine.begin() as conn:
        res = conn.execute(sel).fetchall()
    return res


def test_GB_validate_passes_defaults():
    gb = group.GroupBy(
        column_list=['col1', 'col2'],
    )
    gb.validate()


def test_GB_validate_passes_valid_kwargs():
    gb = group.GroupBy(
        column_list=['col1', 'col2'],
        group_mode=group.GroupMode.DISTINCT.value
    )
    gb.validate()


def test_GB_validate_passes_valid_kwargs_perc():
    gb = group.GroupBy(
        column_list=['col1', 'col2'],
        group_mode=group.GroupMode.PERCENTILE.value,
        num_groups=1234,
    )
    gb.validate()


def test_GB_validate_fails_invalid_col_list():
    gb = group.GroupBy(
        column_list='col1',
    )
    with pytest.raises(rec_exc.BadGroupFormat):
        gb.validate()


def test_GB_validate_fails_invalid_group_mode():
    gb = group.GroupBy(
        column_list=['col1', 'col2'],
        group_mode='potato',
        num_groups=1234,
    )
    with pytest.raises(rec_exc.InvalidGroupType):
        gb.validate()


def test_GB_validate_fails_invalid_num_group():
    gb = group.GroupBy(
        column_list=['col1', 'col2'],
        group_mode=group.GroupMode.PERCENTILE.value,
        num_groups=None,
    )
    with pytest.raises(rec_exc.BadGroupFormat):
        gb.validate()


def test_GB_get_valid_group_by_columns_str_cols(roster_table_obj):
    roster, _ = roster_table_obj
    column_names = ['Student Number', 'Student Email']
    gb = group.GroupBy(column_list=column_names)
    cols = gb.get_validated_group_by_columns(roster)
    assert all(
        [
            isinstance(col, Column) and col.name == name
            for col, name in zip(cols, column_names)
        ]
    )


def test_GB_get_valid_group_by_columns_sa_cols(roster_table_obj):
    roster, _ = roster_table_obj
    input_cols = [roster.columns['Student Number'], roster.columns['Student Email']]
    gb = group.GroupBy(column_list=input_cols)
    cols = gb.get_validated_group_by_columns(roster)
    assert all(
        [
            isinstance(out_col, Column) and out_col.name == in_col.name
            for out_col, in_col in zip(cols, input_cols)
        ]
    )


def test_GB_get_valid_group_by_columns_invalid_col(roster_table_obj):
    roster, _ = roster_table_obj
    input_cols = ['notintable']
    gb = group.GroupBy(column_list=input_cols)
    with pytest.raises(rec_exc.GroupFieldNotFound):
        cols = gb.get_validated_group_by_columns(roster)


def _group_first_val(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.FIRST_VALUE.value]

def _group_last_val(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.LAST_VALUE.value]

def _group_id(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.GROUP_ID.value]


def test_get_distinct_group_select_correct_metadata_fields(roster_distinct_setup):
    res = roster_distinct_setup
    for row in res:
        assert all(
            [
                metadata_field.value in row[group.MATHESAR_GROUP_METADATA]
                for metadata_field in group.GroupMetadataField
            ]
        )


def test_get_distinct_group_select_correct_num_distinct(roster_distinct_setup):
    res = roster_distinct_setup
    assert max([_group_id(row) for row in res]) == 259


def test_get_distinct_group_select_correct_first_last(roster_distinct_setup):
    res = roster_distinct_setup
    for row in res:
        first_val = _group_first_val(row)
        last_val = _group_last_val(row)
        assert row['Student Number'] == first_val['Student Number']
        assert row['Student Email'] == first_val['Student Email']
        assert first_val == last_val





#
#
# def test_get_distinct_tuple_values_distinct(roster_table_obj):
#     roster, engine = roster_table_obj
#     column_list = [
#         roster.columns["Student Number"],
#         roster.columns["Student Email"],
#     ]
#     record_list = get_distinct_tuple_values(
#         column_list, engine
#     )
#     for i in range(len(record_list) - 1):
#         assert record_list[i] != record_list[i + 1]
#
#
# def test_get_distinct_tuple_values_raises_when_no_table(roster_table_obj):
#     roster, engine = roster_table_obj
#     column_list = [
#         "Student Number",
#         "Student Email",
#     ]
#     with pytest.raises(AssertionError):
#         get_distinct_tuple_values(
#             column_list, engine
#         )
#
#
# def test_get_distinct_tuple_values_with_string_column_input(roster_table_obj):
#     roster, engine = roster_table_obj
#     column_list = [
#         "Student Number",
#         "Student Email",
#     ]
#     record_list = get_distinct_tuple_values(
#         column_list, engine, table=roster,
#     )
#     assert len(record_list) == 259
#
#
# def test_get_distinct_tuple_values_limit(roster_table_obj):
#     roster, engine = roster_table_obj
#     column_list = [
#         "Student Number",
#         "Student Email",
#     ]
#     record_list = get_distinct_tuple_values(
#         column_list, engine, table=roster, limit=10
#     )
#     assert len(record_list) == 10
#
#
# def test_get_distinct_tuple_values_offset(roster_table_obj):
#     roster, engine = roster_table_obj
#     column_list = [
#         "Student Number",
#         "Student Email",
#     ]
#     record_list_base = get_distinct_tuple_values(
#         column_list, engine, table=roster, limit=20
#     )
#     record_list_offset = get_distinct_tuple_values(
#         column_list, engine, table=roster, limit=10, offset=10
#     )
#     assert record_list_offset == record_list_base[10:]
#
#
# def test_get_distinct_tuple_values_feeds_get_records(roster_table_obj):
#     roster, engine = roster_table_obj
#     column_list = [
#         "Student Number",
#         "Student Email",
#     ]
#     distinct_tuples = get_distinct_tuple_values(
#         column_list, engine, table=roster, limit=2
#     )
#     filter_list = append_distinct_tuples_to_filter(distinct_tuples[0])
#     record_list = get_records(
#         roster, engine, filters=filter_list
#     )
#     assert all(
#         [
#             record[1] == distinct_tuples[0][0][1]
#             and record[3] == distinct_tuples[0][1][1]
#             for record in record_list
#         ]
#     )
#
#
# def test_get_group_counts_str_field(filter_sort_table_obj):
#     filter_sort, engine = filter_sort_table_obj
#     group_by = ["varchar"]
#     counts = get_group_counts(filter_sort, engine, group_by)
#     assert len(counts) == 101
#     assert ("string1",) in counts
#
#
# def test_get_group_counts_col_field(filter_sort_table_obj):
#     filter_sort, engine = filter_sort_table_obj
#     group_by = [filter_sort.c.varchar]
#     counts = get_group_counts(filter_sort, engine, group_by)
#     assert len(counts) == 101
#     assert ("string1",) in counts
#
#
# def test_get_group_counts_mixed_str_col_field(filter_sort_table_obj):
#     filter_sort, engine = filter_sort_table_obj
#     group_by = ["varchar", filter_sort.c.numeric]
#     counts = get_group_counts(filter_sort, engine, group_by)
#     assert len(counts) == 101
#     assert ("string1", 1) in counts
#
#
# limit_offset_test_list = [
#     (limit, offset)
#     for limit in [None, 0, 25, 50, 100]
#     for offset in [None, 0, 25, 50, 100]
# ]
#
#
# @pytest.mark.parametrize("limit,offset", limit_offset_test_list)
# def test_get_group_counts_limit_offset_ordering(roster_table_obj, limit, offset):
#     roster, engine = roster_table_obj
#     order_by = [{"field": "Grade", "direction": "desc", "nullslast": True}]
#     group_by = [roster.c["Grade"]]
#     counts = get_group_counts(roster, engine, group_by, limit=limit, offset=offset, order_by=order_by)
#     query = select(group_by[0])
#     query = apply_sort(query, order_by)
#     with engine.begin() as conn:
#         all_records = conn.execute(query).fetchall()
#     if limit is None:
#         end = None
#     elif offset is None:
#         end = limit
#     else:
#         end = limit + offset
#     limit_offset_records = all_records[offset:end]
#     values_to_count = set([record["Grade"] for record in limit_offset_records])
#
#     manual_all_count = Counter(all_records).items()
#     manual_count = {
#         k: v for k, v in manual_all_count if int(k[0]) in values_to_count
#     }
#
#     assert len(counts) == len(manual_count)
#     for value, count in manual_count.items():
#         assert value in counts
#         assert counts[value] == count
#
#
# count_values_test_list = itertools.chain(*[
#     itertools.combinations([
#         "Student Name",
#         "Student Email",
#         "Teacher Email",
#         "Subject",
#         "Grade"
#     ], i) for i in range(1, 5)
# ])
#
#
# @pytest.mark.parametrize("group_by", count_values_test_list)
# def test_get_group_counts_count_values(roster_table_obj, group_by):
#     roster, engine = roster_table_obj
#     counts = get_group_counts(roster, engine, group_by)
#
#     cols = [roster.c[f] for f in group_by]
#     with engine.begin() as conn:
#         all_records = conn.execute(select(*cols)).fetchall()
#     manual_count = Counter(all_records)
#
#     for value, count in manual_count.items():
#         assert value in counts
#         assert counts[value] == count
#
#
# filter_values_test_list = itertools.chain(*[
#     itertools.combinations([
#         {"field": "Student Name", "op": "ge", "value": "Test Name"},
#         {"field": "Student Email", "op": "le", "value": "Test Email"},
#         {"field": "Teacher Email", "op": "like", "value": "%gmail.com"},
#         {"field": "Subject", "op": "eq", "value": "Non-Existent Subject"},
#         {"field": "Grade", "op": "ne", "value": 99}
#     ], i) for i in range(1, 3)
# ])
#
#
# @pytest.mark.parametrize("filter_by", filter_values_test_list)
# def test_get_group_counts_filter_values(roster_table_obj, filter_by):
#     roster, engine = roster_table_obj
#     group_by = ["Student Name"]
#     counts = get_group_counts(roster, engine, group_by, filters=filter_by)
#
#     cols = [roster.c[f] for f in group_by]
#     query = select(*cols)
#     query = apply_filters(query, filter_by)
#     with engine.begin() as conn:
#         all_records = conn.execute(query).fetchall()
#     manual_count = Counter(all_records)
#
#     for value, count in manual_count.items():
#         assert value in counts
#         assert counts[value] == count
#
#
# exceptions_test_list = [
#     ("string", BadGroupFormat),
#     ({"dictionary": ""}, BadGroupFormat),
#     ([{"field": "varchar"}], BadGroupFormat),
#     (["non_existent_field"], GroupFieldNotFound),
# ]
#
#
# @pytest.mark.parametrize("group_by,exception", exceptions_test_list)
# def test_get_group_counts_exceptions(filter_sort_table_obj, group_by, exception):
#     filter_sort, engine = filter_sort_table_obj
#     with pytest.raises(exception):
#         get_group_counts(filter_sort, engine, group_by)
