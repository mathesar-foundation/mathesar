from django.core.cache import cache
import pytest
from sqlalchemy import Column, Integer, String, MetaData
from sqlalchemy import Table as SATable

from db.tables import get_oid_from_table
from mathesar.models import Table


@pytest.fixture
def column_test_table(patent_schema):
    engine = patent_schema._sa_engine
    column_list_in = [
        Column("mycolumn0", Integer, primary_key=True),
        Column("mycolumn1", Integer, nullable=False),
        Column("mycolumn2", Integer),
        Column("mycolumn3", String),
    ]
    db_table = SATable(
        "anewtable",
        MetaData(bind=engine),
        *column_list_in,
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = Table.objects.create(oid=db_table_oid, schema=patent_schema)
    return table


def test_column_list(column_test_table, client):
    cache.clear()
    response = client.get(f"/api/v0/tables/{column_test_table.id}/columns/")
    response_data = response.json()
    assert response_data['count'] == len(column_test_table.sa_columns)
    expect_results = [
        {'name': 'mycolumn0', 'type': 'INTEGER', 'nullable': False, 'primary_key': True},
        {'name': 'mycolumn1', 'type': 'INTEGER', 'nullable': False, 'primary_key': False},
        {'name': 'mycolumn2', 'type': 'INTEGER', 'nullable': True, 'primary_key': False},
        {'name': 'mycolumn3', 'type': 'VARCHAR', 'nullable': True, 'primary_key': False}
    ]
    assert response_data['results'] == expect_results


@pytest.mark.parametrize(
    "index,expect_data",
    [
        (0, {'name': 'mycolumn0', 'type': 'INTEGER', 'nullable': False, 'primary_key': True}),
        (2, {'name': 'mycolumn2', 'type': 'INTEGER', 'nullable': True, 'primary_key': False}),
    ]
)
def test_column_retrieve(index, expect_data, column_test_table, client):
    cache.clear()
    response = client.get(
        f"/api/v0/tables/{column_test_table.id}/columns/{index}/"
    )
    response_data = response.json()
    assert response_data == expect_data


def test_column_retrieve_when_missing(column_test_table, client):
    cache.clear()
    response = client.get(
        f"/api/v0/tables/{column_test_table.id}/columns/15/"
    )
    response_data = response.json()
    assert response_data == {"detail": "Not found."}
    assert response.status_code == 404


def test_column_create(column_test_table, client):
    name = "anewcolumn"
    type_ = "NUMERIC"
    cache.clear()
    num_columns = len(column_test_table.sa_columns)
    data = {
        "name": name, "type": type_
    }
    response = client.post(
        f"/api/v0/tables/{column_test_table.id}/columns/", data=data
    )
    assert response.status_code == 201
    new_columns_response = client.get(
        f"/api/v0/tables/{column_test_table.id}/columns/"
    )
    assert new_columns_response.json()["count"] == num_columns + 1
    actual_new_col = new_columns_response.json()["results"][-1]
    assert actual_new_col["name"] == name
    assert actual_new_col["type"] == type_
