import pytest
import json


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
