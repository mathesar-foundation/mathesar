import pytest

from mathesar.models.query import UIQuery


@pytest.fixture
def patents_query(create_patents_table, get_uid):
    base_table = create_patents_table(table_name=get_uid())
    initial_columns = [
        {
            'id': base_table.get_column_by_name('Center').id,
            'alias': 'col1',
        },
        {
            'id': base_table.get_column_by_name('Case Number').id,
            'alias': 'col2',
        },
    ]
    ui_query = UIQuery.objects.create(
        base_table=base_table,
        initial_columns=initial_columns,
    )
    return ui_query

@pytest.mark.parametrize("limit", [None, 100, 500])
def test_pagination(client, patents_query, limit):
    ui_query = patents_query
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
