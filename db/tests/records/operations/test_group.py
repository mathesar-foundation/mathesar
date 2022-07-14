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
    sel = group._get_distinct_group_select(roster, grouping_columns, None)
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
                    'less_than_eq_value': None, 'greater_than_eq_value': None,
                    'less_than_value': None, 'greater_than_value': None,
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
                    'last_value': {'Center': 'NASA ARC', 'Status': 'Issued'},
                    'less_than_eq_value': None, 'greater_than_eq_value': None,
                    'less_than_value': None, 'greater_than_value': None,
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
                    'last_value': {'Center': 'NASA ARC', 'Status': 'Issued'},
                    'less_than_eq_value': None, 'greater_than_eq_value': None,
                    'less_than_value': None, 'greater_than_value': None,
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


def test_GB_validate_passes_valid_kwargs_mag():
    gb = group.GroupBy(
        columns=['col1'],
        mode=group.GroupMode.MAGNITUDE.value,
    )
    gb.validate()


def test_GB_validate_passes_valid_kwargs_endpoints():
    gb = group.GroupBy(
        columns=['col1'],
        mode=group.GroupMode.ENDPOINTS.value,
        bound_tuples=[('a', 5), ('b', 0)],
    )
    gb.validate()


def test_GB_validate_passes_valid_kwargs_count_by():
    gb = group.GroupBy(
        columns=['col1'],
        mode=group.GroupMode.COUNT_BY.value,
        count_by=3,
        global_min=234.5,
        global_max=987.6
    )
    gb.validate()


def test_GB_validate_passes_valid_kwargs_prefix():
    gb = group.GroupBy(
        columns=['col1'],
        mode=group.GroupMode.PREFIX.value,
        prefix_length=3
    )
    gb.validate()


def test_GB_validate_passes_valid_kwargs_extract_field():
    gb = group.GroupBy(
        columns=['col1'],
        mode=group.GroupMode.EXTRACT.value,
        extract_field='year'
    )
    gb.validate()


def test_GB_validate_fails_invalid_mode():
    with pytest.raises(records_exceptions.InvalidGroupType):
        group.GroupBy(
            columns=['col1', 'col2'],
            mode='potato',
            num_groups=1234,
        )


def test_GB_validate_fails_invalid_num_group():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1', 'col2'],
            mode=group.GroupMode.PERCENTILE.value,
            num_groups=None,
        )


def test_GB_validate_fails_invalid_columns_len():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1', 'col2'],
            mode=group.GroupMode.MAGNITUDE.value,
        )


def test_GB_validate_fails_missing_bound_tuples():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1', 'col2'],
            mode=group.GroupMode.ENDPOINTS.value,
        )


def test_GB_validate_fails_missing_prefix_length():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1'],
            mode=group.GroupMode.PREFIX.value,
        )


def test_GB_validate_fails_multi_cols_prefix():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1', 'col2'],
            mode=group.GroupMode.PREFIX.value,
            prefix_length=3
        )


def test_GB_validate_fails_missing_extract_field():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1'],
            mode=group.GroupMode.EXTRACT.value,
        )


def test_GB_validate_fails_multi_cols_extract():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1', 'col2'],
            mode=group.GroupMode.EXTRACT.value,
            extract_field='year'
        )


def test_GB_validate_fails_missing_count_by():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1'],
            mode=group.GroupMode.COUNT_BY.value,
            count_by=None,
            global_min=234.5,
            global_max=987.6
        )


def test_GB_validate_fails_missing_global_min():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1'],
            mode=group.GroupMode.COUNT_BY.value,
            count_by=3,
            global_min=None,
            global_max=987.6
        )


def test_GB_validate_fails_missing_global_max():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1'],
            mode=group.GroupMode.COUNT_BY.value,
            count_by=3,
            global_min=234.5,
            global_max=None
        )


def test_GB_validate_fails_multiple_cols_with_count_by():
    with pytest.raises(records_exceptions.BadGroupFormat):
        group.GroupBy(
            columns=['col1', 'col2'],
            mode=group.GroupMode.COUNT_BY.value,
            count_by=3,
            global_min=234.5,
            global_max=987.6
        )


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


def _group_geq_value(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.GEQ_VALUE.value]


def _group_lt_value(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.LT_VALUE.value]


def _group_id(row):
    return row[group.MATHESAR_GROUP_METADATA][group.GroupMetadataField.GROUP_ID.value]


basic_group_modes = [
    group.GroupMode.DISTINCT.value,
    group.GroupMode.PERCENTILE.value,
    group.GroupMode.ENDPOINTS.value,
]


@pytest.mark.parametrize('group_mode', basic_group_modes)
def test_get_group_augmented_records_pg_query_metadata_fields(roster_table_obj, group_mode):
    roster, engine = roster_table_obj
    group_by = group.GroupBy(
        ['Student Number', 'Student Name'],
        mode=group_mode,
        num_groups=12,
        bound_tuples=[
            ('00000000-0000-0000-0000-000000000000', 'Alice'),
            ('77777777-7777-7777-7777-777777777777', 'Margot'),
            ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Zachary'),
        ]
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()
    for row in res:
        assert all(
            [
                metadata_field.value in row[group.MATHESAR_GROUP_METADATA]
                for metadata_field in group.GroupMetadataField
            ]
        )


def test_smoke_get_group_augmented_records_pg_query_prefix(roster_table_obj):
    roster, engine = roster_table_obj
    group_by = group.GroupBy(
        ['Student Number'],
        mode=group.GroupMode.PREFIX.value,
        prefix_length=1,
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()
    for row in res:
        assert all(
            [
                metadata_field.value in row[group.MATHESAR_GROUP_METADATA]
                for metadata_field in group.GroupMetadataField
            ]
        )


def test_smoke_get_group_augmented_records_pg_query_email_preproc(roster_table_obj):
    roster, engine = roster_table_obj
    group_by = group.GroupBy(
        ['Student Email'],
        mode=group.GroupMode.DISTINCT.value,
        preproc=['extract_email_domain']
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()
    for row in res:
        assert all(
            [
                metadata_field.value in row[group.MATHESAR_GROUP_METADATA]
                for metadata_field in group.GroupMetadataField
            ]
        )


@pytest.mark.parametrize('preproc', ['extract_uri_authority', 'extract_uri_scheme'])
def test_smoke_get_group_augmented_records_pg_query_uris_preproc(uris_table_obj, preproc):
    roster, engine = uris_table_obj
    group_by = group.GroupBy(
        ['uri'],
        mode=group.GroupMode.DISTINCT.value,
        preproc=[preproc]
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()
    for row in res:
        assert all(
            [
                metadata_field.value in row[group.MATHESAR_GROUP_METADATA]
                for metadata_field in group.GroupMetadataField
            ]
        )


def test_smoke_get_group_augmented_records_pg_query_extract(times_table_obj):
    roster, engine = times_table_obj
    group_by = group.GroupBy(
        ['date'],
        mode=group.GroupMode.EXTRACT.value,
        extract_field='month',
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()
    for row in res:
        assert all(
            [
                metadata_field.value in row[group.MATHESAR_GROUP_METADATA]
                for metadata_field in group.GroupMetadataField
            ]
        )


datetime_trunc_tests_def = [
    ('date', 'truncate_to_year', 3),
    ('timestamp', 'truncate_to_year', 3),
    ('date', 'truncate_to_month', 4),
    ('timestamp', 'truncate_to_month', 4),
    ('date', 'truncate_to_day', 6),
    ('timestamp', 'truncate_to_day', 6),
]


@pytest.mark.parametrize('col,preproc,num', datetime_trunc_tests_def)
def test_get_group_augmented_records_pg_query_datetimes_preproc(
        times_table_obj, col, preproc, num
):
    roster, engine = times_table_obj
    group_by = group.GroupBy(
        [col],
        mode=group.GroupMode.DISTINCT.value,
        preproc=[preproc]
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()

    assert max([_group_id(row) for row in res]) == num


datetime_extract_tests_def = [
    ('date', 'year', 3),
    ('timestamp', 'year', 3),
    ('date', 'month', 2),
    ('timestamp', 'month', 2),
    ('date', 'day', 3),
    ('timestamp', 'day', 3),
]


@pytest.mark.parametrize('col,field,num', datetime_extract_tests_def)
def test_get_group_augmented_records_pg_query_datetimes_extract(
        times_table_obj, col, field, num
):
    roster, engine = times_table_obj
    group_by = group.GroupBy(
        [col], mode=group.GroupMode.EXTRACT.value, extract_field=field
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()

    assert max([_group_id(row) for row in res]) == num


single_col_number_modes = [
    group.GroupMode.MAGNITUDE.value,
    group.GroupMode.COUNT_BY.value,
]


@pytest.mark.parametrize('mode', single_col_number_modes)
def test_smoke_get_group_augmented_records_pg_query_magnitude(magnitude_table_obj, mode):
    magnitude, engine = magnitude_table_obj
    group_by = group.GroupBy(
        ['big_num'],
        mode=mode,
        count_by=50,
        global_min=0,
        global_max=1000
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(magnitude, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()
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
            mode=group.GroupMode.DISTINCT.value,
            preproc=[None, 'extract_email_domain']
        ),
        3
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
    ),
    (
        group.GroupBy(
            ['Subject', 'Grade'],
            mode=group.GroupMode.ENDPOINTS.value,
            bound_tuples=[
                ('a', 50), ('f', 75), ('k', 25), ('p', 90), ('r', 100)
            ]
        ),
        4
    ),
    (
        group.GroupBy(
            ['Student Number'],
            mode=group.GroupMode.PREFIX.value,
            prefix_length=1
        ),
        16
    ),
]


@pytest.mark.parametrize('group_by,num', group_by_num_list)
def test_get_distinct_group_select_correct_num_group_id(
        roster_table_obj, group_by, num
):
    roster, engine = roster_table_obj
    augmented_pg_query = group.get_group_augmented_records_pg_query(roster, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()

    assert max([_group_id(row) for row in res]) == num


magnitude_lt_zero = ['sm_num', 'sm_dbl']
magnitude_gt_zero = ['id', 'big_num', 'big_int', 'pm_seq', 'tens_seq']


magnitude_columns = magnitude_lt_zero + magnitude_gt_zero

magnitude_max_group_ids = [30, 87, 21, 85, 90, 21, 21]


@pytest.mark.parametrize('col_name,num', zip(magnitude_columns, magnitude_max_group_ids))
def test_group_select_correct_num_group_id_magnitude(
        magnitude_table_obj, col_name, num
):
    magnitude, engine = magnitude_table_obj
    group_by = group.GroupBy(
        [col_name],
        mode=group.GroupMode.MAGNITUDE.value,
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(magnitude, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()

    assert max([_group_id(row) for row in res]) == num


count_by_count_by = [0.000005, 0.00001, 7, 80.5, 750, 25, 100]
count_by_global_min = [0, 0, 0, -100, -4500, -100, 0]
count_by_global_max = [0.0003, 0.001, 250, 600, 5500, 100, 2000]
count_by_max_group_id = [59, 99, 29, 8, 13, 8, 20]


@pytest.mark.parametrize(
    'col_name,count_by,global_min,global_max,num', zip(
        magnitude_columns, count_by_count_by, count_by_global_min,
        count_by_global_max, count_by_max_group_id
    )
)
def test_group_select_correct_num_group_id_count_by(
        magnitude_table_obj, col_name, count_by, global_min, global_max, num
):
    magnitude, engine = magnitude_table_obj
    group_by = group.GroupBy(
        [col_name],
        mode=group.GroupMode.COUNT_BY.value,
        count_by=count_by,
        global_min=global_min,
        global_max=global_max,
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(magnitude, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()

    assert max([_group_id(row) for row in res]) == num


@pytest.mark.parametrize('col_name', magnitude_columns)
def test_magnitude_group_select_bounds_chain(magnitude_table_obj, col_name):
    magnitude, engine = magnitude_table_obj
    group_by = group.GroupBy(
        [col_name],
        mode=group.GroupMode.MAGNITUDE.value,
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(magnitude, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()

    for i in range(len(res) - 1):
        assert (
            _group_lt_value(res[i])[col_name] <= _group_geq_value(res[i + 1])[col_name]
            or (
                _group_lt_value(res[i]) == _group_lt_value(res[i + 1])
                and _group_geq_value(res[i]) == _group_geq_value(res[i + 1])
            )
        )


@pytest.mark.parametrize('col_name', magnitude_columns)
def test_magnitude_group_select_bounds_pretty(magnitude_table_obj, col_name):
    magnitude, engine = magnitude_table_obj
    group_by = group.GroupBy(
        [col_name],
        mode=group.GroupMode.MAGNITUDE.value,
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(magnitude, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()

    for row in res:
        assert (
            len(str(_group_lt_value(row)[col_name])) <= 7
            and len(str(_group_geq_value(row)[col_name])) <= 7
        )


@pytest.mark.parametrize('col_name', magnitude_columns)
def test_magnitude_group_select_inside_bounds(magnitude_table_obj, col_name):
    magnitude, engine = magnitude_table_obj
    group_by = group.GroupBy(
        [col_name],
        mode=group.GroupMode.MAGNITUDE.value,
    )
    augmented_pg_query = group.get_group_augmented_records_pg_query(magnitude, group_by)
    with engine.begin() as conn:
        res = conn.execute(augmented_pg_query).fetchall()

    for row in res:
        assert (
            row[col_name] < _group_lt_value(row)[col_name]
            and row[col_name] >= _group_geq_value(row)[col_name]
        )


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
