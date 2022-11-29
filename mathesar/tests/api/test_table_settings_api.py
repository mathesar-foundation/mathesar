import pytest
from sqlalchemy import Column, Integer, MetaData
from sqlalchemy import Table as SATable

from db.tables.operations.select import get_oid_from_table
from mathesar.models import base as models_base


@pytest.fixture
def schema_name():
    return 'table_tests'


@pytest.fixture
def schema(create_schema, schema_name):
    return create_schema(schema_name)


@pytest.fixture
def column_test_table(patent_schema, engine):
    column_list_in = [
        Column("mycolumn0", Integer, primary_key=True),
        Column("mycolumn1", Integer, nullable=False),
    ]
    db_table = SATable(
        "anewtable",
        MetaData(bind=engine),
        *column_list_in,
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = models_base.Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    return table


def test_create_non_empty_table_settings(client, schema, create_patents_table, schema_name):
    table = create_patents_table('Table 2', schema_name=schema_name)
    first_non_primary_column = table.columns.order_by('attnum')[1]
    expected_preview_template = f'{{{first_non_primary_column.id}}}'
    response = client.get(
        f"/api/db/v0/tables/{table.id}/settings/"
    )
    response_data = response.json()
    results = response_data['results']
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert results[0]['preview_settings']['template'] == expected_preview_template
    assert results[0]['preview_settings']['customized'] is False


def test_create_empty_table_settings(client, schema, empty_nasa_table, schema_name):
    table = empty_nasa_table
    primary_key_column_id = table.get_column_name_id_bidirectional_map()['id']
    expected_preview_template = f'{{{primary_key_column_id}}}'
    response = client.get(
        f"/api/db/v0/tables/{table.id}/settings/"
    )
    response_data = response.json()
    results = response_data['results']
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert results[0]['preview_settings']['template'] == expected_preview_template
    assert results[0]['preview_settings']['customized'] is False


update_clients_with_status_codes = [
    ('superuser_client_factory', 200),
    ('db_manager_client_factory', 200),
    ('db_editor_client_factory', 404),
    ('schema_manager_client_factory', 200),
    ('schema_viewer_client_factory', 404),
    ('db_viewer_schema_manager_client_factory', 200)
]


@pytest.mark.parametrize('client_name,expected_status_code', update_clients_with_status_codes)
def test_update_table_settings_permission(create_patents_table, request, client_name, expected_status_code):
    table_name = 'NASA Table'
    table = create_patents_table(table_name)
    settings_id = table.settings.id
    client = request.getfixturevalue(client_name)(table.schema)
    columns = models_base.Column.objects.filter(table=table).values_list('id', flat=True)
    preview_template = ','.join(f'{{{ column }}}' for column in columns)
    data = {
        "preview_settings": {
            'template': preview_template,
        }
    }
    response = client.patch(
        f"/api/db/v0/tables/{table.id}/settings/{settings_id}/", data
    )
    assert response.status_code == expected_status_code


def test_update_table_settings(client, column_test_table):
    columns = models_base.Column.objects.filter(table=column_test_table).values_list('id', flat=True)
    preview_template = ','.join(f'{{{ column }}}' for column in columns)
    settings_id = column_test_table.settings.id
    data = {
        "preview_settings": {
            'template': preview_template,
        }
    }
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/settings/{settings_id}/",
        data=data,
    )
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['preview_settings']['template'] == preview_template
    assert response_data['preview_settings']['customized'] is True
