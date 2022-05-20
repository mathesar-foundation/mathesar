import pytest


@pytest.fixture
def schema_name():
    return 'table_tests'


@pytest.fixture
def schema(create_schema, schema_name):
    return create_schema(schema_name)


def test_create_table_settings(client, schema, create_table, schema_name):
    table = create_table('Table 2', schema=schema_name)
    response = client.get(
        f"/api/db/v0/tables/{table.id}/settings/"
    )
    response_data = response.json()
    print(response_data)
    assert response.status_code == 200
    assert response_data['count'] == 1
