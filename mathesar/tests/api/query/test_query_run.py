from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.models.base import Column


def test_queries_run_minimal(create_patents_table, client):
    base_table = create_patents_table(table_name='patent_query_run_minimal_table')
    initial_columns = [
        {
            'id': base_table.get_column_by_name('Center').id,
            'alias': 'col1',
            'display_name': 'Column 1',
        },
        {
            'id': base_table.get_column_by_name('Case Number').id,
            'alias': 'col2',
            'display_name': 'Column 2',
        },
    ]
    data = {
        'base_table': base_table.id,
        'initial_columns': initial_columns,
        'parameters': {
            'order_by': [
                {'field': 'col1', 'direction': 'asc'},
                {'field': 'col2', 'direction': 'desc'}
            ],
            'limit': 2,
            'offset': 3
        }
    }

    expect_query = (
        {k: v for k, v in data.items() if k != 'parameters'}
        | {'schema': base_table.schema.id, 'transformations': None}
    )

    expect_response_json = {
        'query': expect_query,
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
                'display_options': None,
                'is_initial_column': True,
                'input_table_name': 'patent_query_run_minimal_table',
                'input_column_name': 'Center',
                'input_alias': None,
            },
            'col2': {
                'alias': 'col2',
                'display_name': 'Column 2',
                'type': 'text',
                'type_options': None,
                'display_options': None,
                'is_initial_column': True,
                'input_table_name': 'patent_query_run_minimal_table',
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

    response = client.post('/api/db/v0/queries/run/', data, format='json')
    assert response.status_code == 200
    assert response.json() == expect_response_json


def test_queries_run_deleted_column(create_patents_table, client):
    base_table = create_patents_table(table_name='patent_query_run_minimal_table')
    to_be_deleted_column_id = base_table.get_column_by_name('Center').id
    initial_columns = [
        {
            'id': to_be_deleted_column_id,
            'alias': 'col1',
            'display_name': 'Column 1',
        },
        {
            'id': base_table.get_column_by_name('Case Number').id,
            'alias': 'col2',
            'display_name': 'Column 2',
        },
    ]
    data = {
        'base_table': base_table.id,
        'initial_columns': initial_columns,
        'parameters': {
            'order_by': [
                {'field': 'col1', 'direction': 'asc'},
                {'field': 'col2', 'direction': 'desc'}
            ],
            'limit': 2,
            'offset': 3
        }
    }
    Column.objects.get(id=to_be_deleted_column_id).delete()
    response = client.post('/api/db/v0/queries/run/', data, format='json')
    response_data = response.json()
    assert response.status_code == 400
    assert response_data[0]['code'] == ErrorCodes.DeletedColumnAccess.value
    assert response_data[0]['detail']['column_id'] == to_be_deleted_column_id
