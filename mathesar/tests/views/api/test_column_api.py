import json
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
        {
            'name': 'mycolumn0',
            'type': 'INTEGER',
            'type_options': None,
            'index': 0,
            'nullable': False,
            'primary_key': True,
            'valid_target_types': None,
        },
        {
            'name': 'mycolumn1',
            'type': 'INTEGER',
            'type_options': None,
            'index': 1,
            'nullable': False,
            'primary_key': False,
            'valid_target_types': None,
        },
        {
            'name': 'mycolumn2',
            'type': 'INTEGER',
            'type_options': None,
            'index': 2,
            'nullable': True,
            'primary_key': False,
            'valid_target_types': None,
        },
        {
            'name': 'mycolumn3',
            'type': 'VARCHAR',
            'type_options': None,
            'index': 3,
            'nullable': True,
            'primary_key': False,
            'valid_target_types': [
                'BOOLEAN',
                'DECIMAL',
                'DOUBLE PRECISION',
                'FLOAT',
                'INTERVAL',
                'NUMERIC',
                'REAL',
                'VARCHAR',
                'mathesar_types.email',
            ],
        }
    ]
    assert response_data['results'] == expect_results


@pytest.mark.parametrize(
    "index,expect_data",
    [
        (
            0,
            {
                'name': 'mycolumn0',
                'type': 'INTEGER',
                'type_options': None,
                'index': 0,
                'nullable': False,
                'primary_key': True,
                'valid_target_types': None
            },
        ),
        (
            2,
            {
                'name': 'mycolumn2',
                'type': 'INTEGER',
                'type_options': None,
                'index': 2,
                'nullable': True,
                'primary_key': False,
                'valid_target_types': None
            },
        ),
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


def test_column_create_retrieve_options(column_test_table, client):
    name = "anewcolumn"
    type_ = "NUMERIC"
    type_options = {"precision": 5, "scale": 3}
    cache.clear()
    num_columns = len(column_test_table.sa_columns)
    data = {
        "name": name, "type": type_, "type_options": type_options,
    }
    response = client.post(
        f"/api/v0/tables/{column_test_table.id}/columns/",
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 201
    new_columns_response = client.get(
        f"/api/v0/tables/{column_test_table.id}/columns/"
    )
    assert new_columns_response.json()["count"] == num_columns + 1
    actual_new_col = new_columns_response.json()["results"][-1]
    assert actual_new_col["name"] == name
    assert actual_new_col["type"] == type_
    assert actual_new_col["type_options"] == type_options


invalid_type_options = [
    {"precision": 5, "scale": 8},
    {"precision": "asd"},
    {"nonoption": 34},
]


@pytest.mark.parametrize("type_options", invalid_type_options)
def test_column_create_bad_options(column_test_table, client, type_options):
    name = "anewcolumn"
    type_ = "NUMERIC"
    cache.clear()
    data = {
        "name": name, "type": type_, "type_options": type_options,
    }
    response = client.post(
        f"/api/v0/tables/{column_test_table.id}/columns/",
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 400


def test_column_create_duplicate(column_test_table, client):
    column = column_test_table.sa_columns[0]
    name = column.name
    type_ = "NUMERIC"
    cache.clear()
    data = {
        "name": name, "type": type_
    }
    response = client.post(
        f"/api/v0/tables/{column_test_table.id}/columns/", data=data
    )
    assert response.status_code == 400


def test_column_update_name(column_test_table, client):
    cache.clear()
    name = "updatedname"
    data = {"name": name}
    response = client.patch(
        f"/api/v0/tables/{column_test_table.id}/columns/1/", data=data
    )
    assert response.json()["name"] == name


def test_column_update_type(column_test_table, client):
    cache.clear()
    type_ = "BOOLEAN"
    data = {"type": type_}
    response = client.patch(
        f"/api/v0/tables/{column_test_table.id}/columns/3/", data=data
    )
    assert response.json()["type"] == type_


def test_column_update_type_options(column_test_table, client):
    cache.clear()
    type_ = "NUMERIC"
    type_options = {"precision": 3, "scale": 1}
    data = {"type": type_, "type_options": type_options}
    response = client.patch(
        f"/api/v0/tables/{column_test_table.id}/columns/3/",
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.json()["type"] == type_
    assert response.json()["type_options"] == type_options


@pytest.mark.parametrize("type_options", invalid_type_options)
def test_column_update_type_invalid_options(column_test_table, client, type_options):
    cache.clear()
    type_ = "NUMERIC"
    data = {"type": type_, "type_options": type_options}
    response = client.patch(
        f"/api/v0/tables/{column_test_table.id}/columns/3/",
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 400


def test_column_update_type_invalid_cast(column_test_table, client):
    cache.clear()
    type_ = "mathesar_types.email"
    data = {"type": type_}
    response = client.patch(
        f"/api/v0/tables/{column_test_table.id}/columns/1/", data=data
    )
    assert response.status_code == 400


def test_column_update_when_missing(column_test_table, client):
    cache.clear()
    name = "updatedname"
    data = {"name": name}
    response = client.patch(
        f"/api/v0/tables/{column_test_table.id}/columns/15/", data=data
    )
    response_data = response.json()
    assert response_data == {"detail": "Not found."}
    assert response.status_code == 404


def test_column_destroy(column_test_table, client):
    cache.clear()
    num_columns = len(column_test_table.sa_columns)
    col_one_name = column_test_table.sa_columns[1].name
    response = client.delete(
        f"/api/v0/tables/{column_test_table.id}/columns/1/"
    )
    assert response.status_code == 204
    new_columns_response = client.get(
        f"/api/v0/tables/{column_test_table.id}/columns/"
    )
    new_data = new_columns_response.json()
    assert col_one_name not in [col["name"] for col in new_data["results"]]
    assert new_data["count"] == num_columns - 1


def test_column_destroy_when_missing(column_test_table, client):
    cache.clear()
    response = client.delete(
        f"/api/v0/tables/{column_test_table.id}/columns/15/"
    )
    response_data = response.json()
    assert response_data == {"detail": "Not found."}
    assert response.status_code == 404
