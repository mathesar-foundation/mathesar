import pytest
import json

from mathesar.models.query import UIQuery


@pytest.fixture
def joining_patents_query(academics_ma_tables):
    academics_table = academics_ma_tables['academics']
    institutions_table = academics_ma_tables['universities']
    display_names = {
        'name': 'name',
        'institution_name': 'institution name',
    }
    initial_columns = [
        {
            'id': academics_table.get_column_by_name('name').id,
            'alias': 'name',
        },
        {
            'id': institutions_table.get_column_by_name('name').id,
            'alias': 'institution_name',
            'jp_path': [[
                academics_table.get_column_by_name('institution').id,
                institutions_table.get_column_by_name('id').id,
            ]],
        },
    ]
    display_options = {
        'name': dict(a=1),
        'institution_name': dict(b=2),
    }
    ui_query = UIQuery.objects.create(
        base_table=academics_table,
        initial_columns=initial_columns,
        display_options=display_options,
        display_names=display_names,
    )
    return ui_query


@pytest.mark.parametrize("limit", [None, 100, 500])
def test_basics(client, minimal_patents_query, limit):
    ui_query = minimal_patents_query
    total_rows_in_table = 1393
    default_limit = 50
    response = client.get(f'/api/db/v0/queries/{ui_query.id}/records/?limit={limit}')
    response_json = response.json()
    assert response.status_code == 200
    expected_result_count = limit or default_limit
    _assert_well_formed_records(
        response_json,
        expected_result_count,
        total_rows_in_table
    )


def test_query_with_joins(client, joining_patents_query):
    ui_query = joining_patents_query
    total_rows_in_table = 3
    response = client.get(f'/api/db/v0/queries/{ui_query.id}/records/')
    response_json = response.json()
    assert response.status_code == 200
    expected_result_count = 3
    _assert_well_formed_records(
        response_json,
        expected_result_count,
        total_rows_in_table
    )
    response_json['results'] == [
        {'name': 'academic1', 'institution_name': 'uni1'},
        {'name': 'academic2', 'institution_name': 'uni1'},
        {'name': 'academic3', 'institution_name': 'uni2'},
    ]


def test_grouping(client, minimal_patents_query):
    ui_query = minimal_patents_query
    total_rows_in_table = 1393
    alias_of_column_to_group_on = 'col1'
    grouping = {'columns': [alias_of_column_to_group_on]}
    grouping_json = json.dumps(grouping)
    limit = 150
    response = client.get(
        f'/api/db/v0/queries/{ui_query.id}/records/?grouping={grouping_json}&limit={limit}'
    )
    response_json = response.json()
    assert response.status_code == 200
    expected_result_count = limit
    _assert_well_formed_records(
        response_json,
        expected_result_count,
        total_rows_in_table
    )
    assert len(response_json['grouping']['groups']) == 2
    assert response_json['grouping']['groups'][0]['count'] == 138
    assert response_json['grouping']['groups'][1]['count'] == 21


def _assert_well_formed_records(
    response_json,
    expected_result_count,
    total_rows_in_table
):
    assert isinstance(response_json, dict)
    assert response_json['count'] == total_rows_in_table
    results = response_json.get('results')
    assert results
    assert isinstance(results, list)
    assert len(results) == expected_result_count
