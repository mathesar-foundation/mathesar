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
    column_order = [1, 2, 3]
    table.settings.column_order = [1, 2, 3]
    table.settings.save()
    response = client.get(
        f"/api/db/v0/tables/{table.id}/settings/"
    )
    response_data = response.json()
    results = response_data['results']
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert results[0]['preview_settings']['template'] == expected_preview_template
    assert results[0]['preview_settings']['customized'] is False
    assert results[0]['column_order'] == column_order


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
    assert results[0]['column_order'] is None


def test_update_table_settings(client, column_test_table):
    columns = models_base.Column.objects.filter(table=column_test_table).values_list('id', flat=True)
    preview_template = ','.join(f'{{{ column }}}' for column in columns)
    settings_id = column_test_table.settings.id
    column_order = [4, 5, 6]
    data = {
        "preview_settings": {
            'template': preview_template,
        },
        "column_order": column_order
    }
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/settings/{settings_id}/",
        data=data,
    )
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['preview_settings']['template'] == preview_template
    assert response_data['preview_settings']['customized'] is True
    assert response_data['column_order'] == column_order

