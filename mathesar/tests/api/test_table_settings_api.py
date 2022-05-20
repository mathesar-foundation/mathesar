import pytest


@pytest.fixture
def schema_name():
    return 'table_tests'


@pytest.fixture
def schema(create_schema, schema_name):
    return create_schema(schema_name)


def test_create_table_settings(client, schema, create_table, schema_name):
    table = create_table('Table 2', schema=schema_name)
    primary_key_column = table.get_column_name_id_bidirectional_map()['id']
    computed_columns = [primary_key_column]
    response = client.get(
        f"/api/db/v0/tables/{table.id}/settings/"
    )
    response_data = response.json()
    results = response_data['results']
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert results[0]['preview_columns']['columns'] == computed_columns
