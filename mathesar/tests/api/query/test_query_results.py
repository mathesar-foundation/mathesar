import json


def test_query_results_minimal(client, minimal_patents_query):
    ui_query = minimal_patents_query
    input_table_name = ui_query.base_table.name
    input_table_id = ui_query.base_table.id
    order_by = json.dumps(
        [
            {'field': 'col1', 'direction': 'asc'},
            {'field': 'col2', 'direction': 'desc'}
        ]
    )
    response = client.get(
        f'/api/db/v0/queries/{ui_query.id}/results/?limit=2&offset=3&order_by={order_by}'
    )
    assert response.status_code == 200

    actual_response_json = response.json()
    expect_response_json = {
        'records': {
            'count': 1393,
            'grouping': None,
            'preview_data': None,
            'results': [
                {'col1': 'NASA Ames Research Center', 'col2': 'ARC-16902-1'},
                {'col1': 'NASA Ames Research Center', 'col2': 'ARC-16892-1A'}
            ]
        },
        'output_columns': ['col1', 'col2'],
        'column_metadata': {
            'col1': {
                'alias': 'col1',
                'display_name': 'Column 1',
                'type': 'text',
                'type_options': None,
                'display_options': {'a': 1},
                'is_initial_column': True,
                'input_table_name': input_table_name,
                'input_table_id': input_table_id,
                'input_column_name': 'Center',
                'input_alias': None,
            },
            'col2': {
                'alias': 'col2',
                'display_name': 'Column 2',
                'type': 'text',
                'type_options': None,
                'display_options': {'b': 2},
                'is_initial_column': True,
                'input_table_name': input_table_name,
                'input_table_id': input_table_id,
                'input_column_name': 'Case Number',
                'input_alias': None,
            }
        },
        'parameters': {
            'order_by': [
                {'field': 'col1', 'direction': 'asc'},
                {'field': 'col2', 'direction': 'desc'}
            ],
            'limit': 2,
            'offset': 3,
        }
    }
    assert actual_response_json == expect_response_json
