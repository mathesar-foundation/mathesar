import pytest

from db.transforms.base import Summarize, Limit
from db.transforms.operations.serialize import serialize_transformation


fully_speced_summarize = \
    Summarize(
        dict(
            aggregation_expressions=[
                dict(
                    function='aggregate_to_array',
                    input_alias='col2',
                    output_alias='col2_agged'
                )
            ],
            base_grouping_column='col1',
            grouping_expressions=[
                dict(
                    input_alias='col1',
                    output_alias='col1_grouped',
                )
            ]
        )
    )


@pytest.mark.parametrize(
    'input_summarize, expected_summarize', [
        [
            Summarize(
                dict(
                    base_grouping_column='col1',
                    aggregation_expressions=[
                        dict(
                            function='aggregate_to_array',
                            input_alias='col2',
                            output_alias='col2_agged'
                        )
                    ],
                ),
            ),
            fully_speced_summarize,
        ],
        [
            Summarize(
                dict(
                    base_grouping_column='col1',
                    grouping_expressions=[
                        dict(
                            input_alias='col1',
                            output_alias='col1_grouped',
                        )
                    ]
                )
            ),
            fully_speced_summarize,
        ],
        [
            Summarize(
                dict(
                    base_grouping_column='col1',
                )
            ),
            fully_speced_summarize,
        ],
    ]
)
def test_partial_summarize_transform(
    create_patents_table, client, input_summarize, expected_summarize,
):
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
    input_summarize_transform_json = \
        serialize_transformation(input_summarize)
    expected_summarize_transform_json = \
        serialize_transformation(expected_summarize)
    limit_transform_json = serialize_transformation(Limit(5))
    input_transformations = [
        limit_transform_json,
        input_summarize_transform_json,
    ]
    output_transformations = [
        limit_transform_json,
        expected_summarize_transform_json,
    ]
    data = {
        'base_table': base_table.id,
        'initial_columns': initial_columns,
        'parameters': {
            'order_by': [
                {'field': 'col1_grouped', 'direction': 'asc'},
                {'field': 'col2_agged', 'direction': 'desc'}
            ],
            'limit': 2
        },
        'transformations': input_transformations,
    }
    expected_query = (
        {k: v for k, v in data.items() if k not in {'parameters'}}
        | {
            'schema': base_table.schema.id,
            'transformations': output_transformations,
        }
    )
    expect_response_json = {
        'column_metadata': {
            'col1': {
                'alias': 'col1',
                'display_name': 'Column 1',
                'display_options': None,
                'input_alias': None,
                'input_column_name': 'Center',
                'input_table_name': 'patent_query_run_minimal_table',
                'is_initial_column': True,
                'type': 'text',
                'type_options': None
            },
            'col1_grouped': {
                'alias': 'col1_grouped',
                'display_name': None,
                'display_options': None,
                'input_alias': 'col1',
                'input_column_name': None,
                'input_table_name': None,
                'is_initial_column': False,
                'type': 'text',
                'type_options': None
            },
            'col2': {
                'alias': 'col2',
                'display_name': 'Column 2',
                'display_options': None,
                'input_alias': None,
                'input_column_name': 'Case Number',
                'input_table_name': 'patent_query_run_minimal_table',
                'is_initial_column': True,
                'type': 'text',
                'type_options': None
            },
            'col2_agged': {
                'alias': 'col2_agged',
                'display_name': None,
                'display_options': None,
                'input_alias': 'col2',
                'input_column_name': None,
                'input_table_name': None,
                'is_initial_column': False,
                'type': '_array',
                'type_options': {'item_type': 'text'}
            }
        },
        'output_columns': [
            'col1_grouped',
            'col2_agged',
        ],
        'parameters': {
            'limit': 2,
            'order_by': [
                {'direction': 'asc', 'field': 'col1_grouped'},
                {'direction': 'desc', 'field': 'col2_agged'}
            ]
        },
        'query': expected_query,
        'records': {
            'count': 2,
            'grouping': None,
            'preview_data': None,
            'results': [
                {
                    'col1_grouped': 'NASA Ames Research Center',
                    'col2_agged': [
                        'ARC-14048-1',
                        'ARC-14231-1',
                        'ARC-14231-2DIV',
                        'ARC-14231-3'
                    ]
                },
                {
                    'col1_grouped': 'NASA Kennedy Space Center',
                    'col2_agged': ['KSC-12871']
                }
            ]
        }
    }
    response = client.post('/api/db/v0/queries/run/', data, format='json')
    assert response.status_code == 200
    assert response.json() == expect_response_json
