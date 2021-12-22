import pytest
from sqlalchemy import Column

from db.records.operations import group
from db.records import exceptions as records_exceptions


@pytest.fixture
def roster_distinct_setup(roster_table_obj):
    roster, engine = roster_table_obj
    input_cols = ['Student Number', 'Student Email']
    gb = group.GroupBy(columns=input_cols)
    grouping_columns = gb.get_validated_group_by_columns(roster)
    sel = group._get_distinct_group_select(roster, grouping_columns)
    with engine.begin() as conn:
        res = conn.execute(sel).fetchall()
    return res


@pytest.fixture
def roster_percentile_subj_grade_setup(roster_table_obj):
    roster, engine = roster_table_obj
    input_cols = ['Subject', 'Grade']
    group_by = group.GroupBy(
        columns=input_cols,
        mode=group.GroupMode.PERCENTILE.value,
        num_groups=12
    )
    grouping_columns = group_by.get_validated_group_by_columns(roster)
    num_groups = group_by.num_groups
    sel = group._get_percentile_range_group_select(roster, grouping_columns, num_groups)
    with engine.begin() as conn:
        res = conn.execute(sel).fetchall()
    return res


@pytest.fixture
def record_dictionary_list():
    return [
        {
            'data': {
                'id': 1, 'Center': 'NASA KSC', 'Status': 'Application', 'Case Number': 'KSC-12871',
                '__mathesar_group_metadata': {
                    'group_id': 15, 'count': 29,
                    'first_value': {'Center': 'NASA KSC', 'Status': 'Application'},
                    'last_value': {'Center': 'NASA KSC', 'Status': 'Application'},
                }
            },
            'metadata': {}
        },
        {
            'data': {
                'id': 2, 'Center': 'NASA ARC', 'Status': 'Issued', 'Case Number': 'ARC-14048-1',
                '__mathesar_group_metadata': {
                    'group_id': 2, 'count': 100,
                    'first_value': {'Center': 'NASA ARC', 'Status': 'Issued'},
                    'last_value': {'Center': 'NASA ARC', 'Status': 'Issued'}
                }
            },
            'metadata': {}
        },
        {
            'data': {
                'id': 3, 'Center': 'NASA ARC', 'Status': 'Issued', 'Case Number': 'ARC-14231-1',
                '__mathesar_group_metadata': {
                    'group_id': 2, 'count': 100,
                    'first_value': {'Center': 'NASA ARC', 'Status': 'Issued'},
                    'last_value': {'Center': 'NASA ARC', 'Status': 'Issued'}
                }
            },
            'metadata': {}
        }
    ]


def test_GB_validate_passes_defaults():
    gb = group.GroupBy(
        columns=['col1', 'col2'],
    )
    gb.validate()


def test_GB_validate_passes_valid_kwargs():
    gb = group.GroupBy(
        columns=['col1', 'col2'],
        mode=group.GroupMode.DISTINCT.value
    )
    gb.validate()


def test_GB_validate_passes_valid_kwargs_perc():
    gb = group.GroupBy(
        columns=['col1', 'col2'],
        mode=group.GroupMode.PERCENTILE.value,
        num_groups=1234,
    )
    gb.validate()


def test_GB_validate_fails_invalid_mode():
    gb = group.GroupBy(
        columns=['col1', 'col2'],
        mode='potato',
        num_groups=1234,
    )
    with pytest.raises(records_exceptions.InvalidGroupType):
        gb.validate()


def test_GB_validate_fails_invalid_num_group():
    gb = group.GroupBy(
        columns=['col1', 'col2'],
        mode=group.GroupMode.PERCENTILE.value,
        num_groups=None,
    )
    with pytest.raises(records_exceptions.BadGroupFormat):
        gb.validate()


def test_GB_get_valid_group_by_columns_str_cols(roster_table_obj):
    roster, _ = roster_table_obj
    column_names = ['Student Number', 'Student Email']
    gb = group.GroupBy(columns=column_names)
    cols = gb.get_validated_group_by_columns(roster)
    assert all(
        [
            isinstance(col, Column) and col.name == name
            for col, name in zip(cols, column_names)
        ]
    )


def test_GB_get_valid_group_by_columns_invalid_col(roster_table_obj):
    roster, _ = roster_table_obj
    input_cols = ['notintable']
    gb = group.GroupBy(columns=input_cols)
    with pytest.raises(records_exceptions.GroupFieldNotFound):
        gb.get_validated_group_by_columns(roster)


def _group_first_val(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.FIRST_VALUE.value]


def _group_last_val(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.LAST_VALUE.value]


def _group_id(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.GROUP_ID.value]


group_modes = [group.GroupMode.DISTINCT.value, group.GroupMode.PERCENTILE.value]


@pytest.mark.parametrize('group_mode', group_modes)
def test_get_group_augmented_records_query_metadata_fields(roster_table_obj, group_mode):
    roster, engine = roster_table_obj
    group_by = group.GroupBy(
        ['Student Number', 'Student Name'], mode=group_mode, num_groups=12
    )
    augmented_query = group.get_group_augmented_records_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_query).fetchall()
    for row in res:
        assert all(
            [
                metadata_field.value in row[group.MATHESAR_GROUP_METADATA]
                for metadata_field in group.GroupMetadataField
            ]
        )


group_by_num_list = [
    (
        group.GroupBy(
            ['Student Number', 'Student Email'],
            mode=group.GroupMode.DISTINCT.value
        ),
        259
    ),
    (
        group.GroupBy(
            ['Student Number', 'Student Email'],
            mode=group.GroupMode.PERCENTILE.value,
            num_groups=12,
        ),
        12
    ),
    (
        group.GroupBy(
            ['Subject', 'Grade'],
            mode=group.GroupMode.PERCENTILE.value,
            num_groups=12,
        ),
        12
    ),
    (
        group.GroupBy(
            ['Subject', 'Grade'],
            mode=group.GroupMode.PERCENTILE.value,
            num_groups=100,
        ),
        100
    ),
    (
        group.GroupBy(
            ['Subject', 'Grade'],
            mode=group.GroupMode.PERCENTILE.value,
            num_groups=1500,
        ),
        1500
    )
]


@pytest.mark.parametrize('group_by,num', group_by_num_list)
def test_get_distinct_group_select_correct_num_group_id(
        roster_table_obj, group_by, num
):
    roster, engine = roster_table_obj
    augmented_query = group.get_group_augmented_records_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_query).fetchall()

    assert max([_group_id(row) for row in res]) == num


def test_get_distinct_group_select_correct_first_last_row_match(roster_distinct_setup):
    res = roster_distinct_setup
    for row in res:
        first_val = _group_first_val(row)
        last_val = _group_last_val(row)
        assert row['Student Number'] == first_val['Student Number']
        assert row['Student Email'] == first_val['Student Email']
        assert first_val == last_val


def test_get_distinct_group_select_groups_distinct(roster_distinct_setup):
    res = roster_distinct_setup
    group_member_tuples = {
        (_group_id(row), row['Student Number'], row['Student Email']) for row in res
    }
    assert (
        len({tup[0] for tup in group_member_tuples})
        == len({(tup[1], tup[2]) for tup in group_member_tuples})
        == len(group_member_tuples)
    )


def test_get_percentile_range_group_first_last(roster_percentile_subj_grade_setup):
    res = roster_percentile_subj_grade_setup
    for row in res:
        first_val = _group_first_val(row)
        last_val = _group_last_val(row)
        assert (first_val['Subject'], first_val['Grade']) <= (row['Subject'], row['Grade'])
        assert (last_val['Subject'], last_val['Grade']) >= (row['Subject'], row['Grade'])


def test_get_percentile_range_group_groups_correct(roster_percentile_subj_grade_setup):
    res = roster_percentile_subj_grade_setup
    group_member_tuples = {
        (
            _group_id(row),
            _group_first_val(row)['Subject'],
            _group_first_val(row)['Grade'],
            _group_last_val(row)['Subject'],
            _group_last_val(row)['Grade'],
        )
        for row in res
    }
    assert (
        len({tup[0] for tup in group_member_tuples})
        == len({(tup[1], tup[2]) for tup in group_member_tuples})
        == len({(tup[3], tup[4]) for tup in group_member_tuples})
        == len({(tup[1], tup[2], tup[3], tup[4]) for tup in group_member_tuples})
        == len(group_member_tuples)
    )


def test_extract_group_metadata_correct_data(record_dictionary_list):
    records, _ = group.extract_group_metadata(
        record_dictionary_list, data_key='data', metadata_key='metadata'
    )
    data_no_meta = [
        {k: v for k, v in rec['data'].items() if k != group.MATHESAR_GROUP_METADATA}
        for rec in record_dictionary_list
    ]
    assert all(
        [rec['data'] == expect for rec, expect in zip(records, data_no_meta)]
    )


def test_extract_group_metadata_correct_metadata(record_dictionary_list):
    records, _ = group.extract_group_metadata(
        record_dictionary_list, data_key='data', metadata_key='metadata'
    )
    assert all(
        [
            rec['metadata'][group.GroupMetadataField.GROUP_ID.value] == _group_id(orig['data'])
            for rec, orig in zip(records, record_dictionary_list)
        ]
    )


def test_extract_group_metadata_correct_groups(record_dictionary_list):
    _, groups = group.extract_group_metadata(
        record_dictionary_list, data_key='data', metadata_key='metadata'
    )
    assert len(groups) == 2
    actual_ids = [
        gr_dict[group.GroupMetadataField.GROUP_ID.value] for gr_dict in groups
    ]
    expect_ids = [
        _group_id(rec['data']) for rec in record_dictionary_list
    ]
    assert set(actual_ids) == set(expect_ids)
