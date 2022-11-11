import pytest

from db.transforms.base import PossiblyPartialTransform, Limit
from db.transforms import known_transforms


class DummyPartialTransform(PossiblyPartialTransform):
    type = "test_dummy"

    def apply_to_relation(self, _):
        pass

    def get_processed(self, db_query, ix_in_transform_pipeline): # noqa: F841
        return Limit(1)


@pytest.fixture
def monkeypatch_known_transforms(monkeypatch):
    """
    We're adding our test dummy transform to the known transforms.
    """
    patched_known_transforms = known_transforms.known_transforms + (DummyPartialTransform,)
    monkeypatch.setattr(known_transforms, 'known_transforms', patched_known_transforms)


def test_transform_processing(
    create_patents_table, client, monkeypatch_known_transforms, # noqa: F841
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
    input_dummy_transform_json = {
        'type': DummyPartialTransform.type,
        'spec': {},
    }
    expected_limit_transform = {
        'type': 'limit',
        'spec': 1,
    }
    input_transformations = [
        input_dummy_transform_json,
    ]
    output_transformations = [
        expected_limit_transform,
    ]
    data = {
        'base_table': base_table.id,
        'initial_columns': initial_columns,
        'parameters': {
            'order_by': [
                {'field': 'col1', 'direction': 'asc'},
                {'field': 'col2', 'direction': 'desc'}
            ],
        },
        'transformations': input_transformations,
    }
    expect_query = (
        {k: v for k, v in data.items() if k not in {'parameters'}}
        | {
            'schema': base_table.schema.id,
            'transformations': output_transformations,
        }
    )
    expect_response_json = {
        'query': expect_query,
        'records': {
            'count': 1,
            'grouping': None,
            'preview_data': None,
            'results': [
                {'col1': 'NASA Kennedy Space Center', 'col2': 'KSC-12871'},
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
        }
    }
    response = client.post('/api/db/v0/queries/run/', data, format='json')
    assert response.status_code == 200
    assert response.json() == expect_response_json
