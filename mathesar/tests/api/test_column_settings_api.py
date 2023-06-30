import pytest
from sqlalchemy import Column, Integer, MetaData
from sqlalchemy import Table as SATable

from db.columns.operations.select import get_column_attnum_from_name
from db.metadata import get_empty_metadata
from db.tables.operations.select import get_oid_from_table
from mathesar.models import base as models_base


@pytest.fixture
def schema_name():
    return 'column_settings_tests'


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
    metadata = get_empty_metadata()
    columns = []
    for sa_column in column_list_in:
        attnum = get_column_attnum_from_name(db_table_oid, sa_column.name, engine, metadata=metadata)
        columns.append(models_base.Column.current_objects.get_or_create(
            table=table,
            attnum=attnum,
        ))
    return table, columns


def test_create_non_empty_column_settings(client, schema, column_test_table, schema_name):
    table, columns = column_test_table
    first_column = columns[1][0]
    width = 20
    first_column.settings.width = width
    table.settings.save()
    response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/{first_column.id}/"
    )
    response_data = response.json()
    results = response_data
    assert response.status_code == 200
    assert results['settings']['width'] == width


update_clients_with_status_codes = [
    ('superuser_client_factory', 200),
    ('db_manager_client_factory', 200),
    ('db_editor_client_factory', 200),
    ('schema_manager_client_factory', 200),
    ('schema_viewer_client_factory', 403),
    ('db_viewer_schema_manager_client_factory', 200)
]


@pytest.mark.parametrize('client_name,expected_status_code', update_clients_with_status_codes)
def test_update_column_settings_permission(column_test_table, request, client_name, expected_status_code):
    table, columns = column_test_table
    first_column = columns[1][0]
    client = request.getfixturevalue(client_name)(table.schema)
    settings_id = first_column.settings.id
    data = {
        "width": 20
    }
    response = client.patch(
        f"/api/ui/v0/tables/{table.id}/columns/{first_column.id}/settings/{settings_id}/",
        data=data,
    )
    assert response.status_code == expected_status_code


def test_update_table_settings(client, column_test_table):
    table, columns = column_test_table
    first_column = columns[1][0]
    width = 20
    settings_id = first_column.settings.id
    data = {
        "width": width
    }
    response = client.patch(
        f"/api/ui/v0/tables/{table.id}/columns/{first_column.id}/settings/{settings_id}/",
        data=data,
    )
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['width'] == width
