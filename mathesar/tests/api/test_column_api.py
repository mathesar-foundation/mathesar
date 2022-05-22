import json

import pytest
from unittest.mock import patch
from django.core.cache import cache
from sqlalchemy import Column, Integer, String, MetaData, Text, select, Boolean, TIMESTAMP, TIME, DATE
from sqlalchemy import Table as SATable

from db.columns.operations.alter import alter_column_type
from db.columns.operations.select import get_column_attnum_from_name
from db.tables.operations.select import get_oid_from_table
from db.tests.types import fixtures
from db.types.money import MathesarMoney
from mathesar import models
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.models import Column as ServiceLayerColumn
from mathesar.tests.api.test_table_api import check_columns_response
from db.constants import COLUMN_NAME_TEMPLATE

engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


@pytest.fixture
def column_test_table(patent_schema):
    engine = patent_schema._sa_engine
    column_list_in = [
        Column("mycolumn0", Integer, primary_key=True),
        Column("mycolumn1", Integer, nullable=False),
        Column("mycolumn2", Integer, server_default="5"),
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
    table = models.Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    return table


def _get_columns_by_name(table, name_list):
    columns_by_name_dict = {
        col.name: col for col in ServiceLayerColumn.objects.filter(table=table) if col.name in name_list
    }
    return [columns_by_name_dict[col_name] for col_name in name_list]


@pytest.fixture
def column_test_table_with_service_layer_options(patent_schema):
    engine = patent_schema._sa_engine
    column_list_in = [
        Column("mycolumn0", Integer, primary_key=True),
        Column("mycolumn1", Boolean),
        Column("mycolumn2", Integer),
        Column("mycolumn3", Text),
        Column("mycolumn4", Text),
        Column("mycolumn5", MathesarMoney),
        Column("mycolumn6", TIMESTAMP),
        Column("mycolumn7", TIME),
        Column("mycolumn8", DATE),
    ]
    column_data_list = [
        {},
        {'display_options': {'input': "dropdown", 'show_fk_preview': True, "custom_labels": {"TRUE": "yes", "FALSE": "no"}}},
        {'display_options': {'show_as_percentage': True, 'show_fk_preview': True, 'number_format': "english"}},
        {'display_options': None},
        {},
        {
            'display_options': {
                'currency_details': {
                    'currency_symbol': "HK $",
                    'number_format': "english",
                    'currency_symbol_location': 'after-minus'
                },
                'show_fk_preview': True
            }
        },
        {'display_options': {'time_format': 'hh:mm', 'date_format': 'YYYY-MM-DD', 'show_fk_preview': True}},
        {'display_options': {'format': 'hh:mm', 'show_fk_preview': True}},
        {'display_options': {'format': 'YYYY-MM-DD', 'show_fk_preview': True}},
    ]
    db_table = SATable(
        "anewtable",
        MetaData(bind=engine),
        *column_list_in,
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = models.Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    service_columns = []
    for column_data in zip(column_list_in, column_data_list):
        attnum = get_column_attnum_from_name(db_table_oid, column_data[0].name, engine)
        service_columns.append(
            ServiceLayerColumn.current_objects.get_or_create(
                table=table,
                attnum=attnum,
                display_options=column_data[1].get('display_options', None)
            )[0]
        )
    return table, service_columns


def test_column_list(column_test_table, client):
    cache.clear()
    response = client.get(f"/api/db/v0/tables/{column_test_table.id}/columns/")
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['count'] == len(column_test_table.sa_columns)
    expect_results = [
        {
            'name': 'mycolumn0',
            'type': 'INTEGER',
            'type_options': None,
            'nullable': False,
            'primary_key': True,
            'display_options': None,
            'default': {
                'value': """nextval('"Patents".anewtable_mycolumn0_seq'::regclass)""",
                'is_dynamic': True
            },
            'valid_target_types': [
                'BIGINT', 'BOOLEAN', 'CHAR', 'DECIMAL', 'DOUBLE PRECISION',
                'FLOAT', 'INTEGER', 'MATHESAR_TYPES.MATHESAR_MONEY',
                'MATHESAR_TYPES.MULTICURRENCY_MONEY', 'MONEY', 'NUMERIC',
                'REAL', 'SMALLINT', 'TEXT', 'VARCHAR',
            ],
        },
        {
            'name': 'mycolumn1',
            'type': 'INTEGER',
            'type_options': None,
            'nullable': False,
            'primary_key': False,
            'display_options': None,
            'default': None,
            'valid_target_types': [
                'BIGINT', 'BOOLEAN', 'CHAR', 'DECIMAL', 'DOUBLE PRECISION',
                'FLOAT', 'INTEGER', 'MATHESAR_TYPES.MATHESAR_MONEY',
                'MATHESAR_TYPES.MULTICURRENCY_MONEY', 'MONEY', 'NUMERIC',
                'REAL', 'SMALLINT', 'TEXT', 'VARCHAR',
            ],
        },
        {
            'name': 'mycolumn2',
            'type': 'INTEGER',
            'type_options': None,
            'nullable': True,
            'primary_key': False,
            'display_options': None,
            'default': {
                'value': 5,
                'is_dynamic': False,
            },
            'valid_target_types': [
                'BIGINT', 'BOOLEAN', 'CHAR', 'DECIMAL', 'DOUBLE PRECISION',
                'FLOAT', 'INTEGER', 'MATHESAR_TYPES.MATHESAR_MONEY',
                'MATHESAR_TYPES.MULTICURRENCY_MONEY', 'MONEY', 'NUMERIC',
                'REAL', 'SMALLINT', 'TEXT', 'VARCHAR',
            ],
        },
        {
            'name': 'mycolumn3',
            'type': 'VARCHAR',
            'type_options': None,
            'nullable': True,
            'primary_key': False,
            'display_options': None,
            'valid_target_types': [
                'BIGINT', 'BOOLEAN', 'CHAR', 'DATE', 'DECIMAL',
                'DOUBLE PRECISION', 'FLOAT', 'INTEGER', 'INTERVAL',
                'MATHESAR_TYPES.EMAIL', 'MATHESAR_TYPES.MATHESAR_MONEY',
                'MATHESAR_TYPES.MULTICURRENCY_MONEY', 'MATHESAR_TYPES.URI',
                'MONEY', 'NUMERIC', 'REAL', 'SMALLINT', 'TEXT',
                'TIME WITH TIME ZONE', 'TIME WITHOUT TIME ZONE',
                'TIMESTAMP WITH TIME ZONE', 'TIMESTAMP WITHOUT TIME ZONE',
                'VARCHAR',
            ],
            'default': None,
        }
    ]
    check_columns_response(response_data['results'], expect_results)


def test_column_create(column_test_table, client):
    name = "anewcolumn"
    type_ = "NUMERIC"
    cache.clear()
    num_columns = len(column_test_table.sa_columns)
    data = {
        "name": name,
        "type": type_,
        "display_options": {"show_as_percentage": True},
        "nullable": False
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/",
        data=data,
    )
    assert response.status_code == 201
    new_columns_response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/"
    )
    assert new_columns_response.json()["count"] == num_columns + 1
    actual_new_col = new_columns_response.json()["results"][-1]
    assert actual_new_col["name"] == name
    assert actual_new_col["type"] == type_
    assert actual_new_col["default"] is None


create_default_test_list = [
    ("BOOLEAN", True, True, True),
    ("INTERVAL", "00:42:00", "P0Y0M0DT0H42M0S", "P0Y0M0DT0H42M0S"),
    ("NUMERIC", 42, 42, 42),
    ("STRING", "test_string", "test_string", "test_string"),
    ("VARCHAR", "test_string", "test_string", "test_string"),
    ("DATE", "2020-1-1", "2020-01-01 AD", "2020-01-01 AD"),
    ("EMAIL", "test@test.com", "test@test.com", "test@test.com"),
]


@pytest.mark.parametrize(
    "type_,default,default_obj,expt_default", create_default_test_list
)
def test_column_create_default(
        column_test_table, type_, default, default_obj, expt_default, client, engine
):
    cache.clear()
    name = "anewcolumn"
    data = {"name": name, "type": type_, "default": {"value": default}}
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/",
        json.dumps(data), content_type='application/json'
    )
    assert response.status_code == 201

    # Ensure the correct serialized date is returned by the API
    new_columns_response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/"
    )
    actual_new_col = new_columns_response.json()["results"][-1]
    assert actual_new_col["default"]["value"] == expt_default

    # Ensure the correct date value is generated when inserting a new record
    sa_table = column_test_table._sa_table
    with engine.begin() as conn:
        conn.execute(sa_table.insert((1, 1, 1, 'str')))
        created_default = conn.execute(select(sa_table)).fetchall()[0][-1]
    assert created_default == default_obj


def test_column_create_invalid_default(column_test_table, client):
    cache.clear()
    name = "anewcolumn"
    data = {
        "name": name,
        "type": "BOOLEAN",
        "default": {"value": "Not a boolean"},
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/",
        json.dumps(data),
        content_type="application/json",
    )
    assert response.status_code == 400
    assert f'default "{data["default"]}" is invalid for type' in response.json()[0]['message']


# NOTE: display option value types are checked backend, but that's it: e.g. a time format may be any string.
create_display_options_test_list = [
    ("BOOLEAN", {"input": "dropdown"}, {"input": "dropdown", 'show_fk_preview': True}),
    ("BOOLEAN", {"input": "checkbox", "custom_labels": {"TRUE": "yes", "FALSE": "no"}},
     {"input": "checkbox", "custom_labels": {"TRUE": "yes", "FALSE": "no"}, 'show_fk_preview': True}),
    ("DATE", {'format': 'YYYY-MM-DD'}, {'format': 'YYYY-MM-DD', 'show_fk_preview': True}),
    ("INTERVAL", {'min': 's', 'max': 'h', 'show_units': True}, {'min': 's', 'max': 'h', 'show_units': True, 'show_fk_preview': True}),
    ("MONEY",
     {'number_format': "english", 'currency_symbol': '$', 'currency_symbol_location': 'after-minus'},
     {'currency_symbol': '$', 'currency_symbol_location': 'after-minus', 'number_format': "english", 'show_fk_preview': True}),
    ("NUMERIC", {"show_as_percentage": True, 'number_format': None}, {"show_as_percentage": True, 'number_format': None, 'show_fk_preview': True}),
    ("NUMERIC",
     {"show_as_percentage": True, 'number_format': "english"},
     {"show_as_percentage": True, 'number_format': "english", 'show_fk_preview': True}),
    ("TIMESTAMP WITH TIME ZONE", {'date_format': 'x', 'time_format': 'x'}, {'date_format': 'x', 'time_format': 'x', 'show_fk_preview': True}),
    ("TIMESTAMP WITHOUT TIME ZONE", {'date_format': 'x', 'time_format': 'x'}, {'date_format': 'x', 'time_format': 'x', 'show_fk_preview': True}),
    ("TIME WITHOUT TIME ZONE", {'format': 'hh:mm'}, {'format': 'hh:mm', 'show_fk_preview': True}),
    ("TIME WITH TIME ZONE", {'format': 'hh:mm Z'}, {'format': 'hh:mm Z', 'show_fk_preview': True}),
]


@pytest.mark.parametrize("type_,display_options, expected_display_options", create_display_options_test_list)
def test_column_create_display_options(
        column_test_table, type_, display_options, expected_display_options, client, engine
):
    cache.clear()
    name = "anewcolumn"
    data = {"name": name, "type": type_, "display_options": display_options}
    response = client.post(f"/api/db/v0/tables/{column_test_table.id}/columns/", data)
    assert response.status_code == 201

    # Ensure the correct serialized date is returned by the API
    new_columns_response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/"
    )
    actual_new_col = new_columns_response.json()["results"][-1]
    assert actual_new_col["display_options"] == expected_display_options


_too_long_string = "x" * 256

create_display_options_invalid_test_list = [
    ("BOOLEAN", {"input": "invalid", "use_custom_columns": False}),
    ("BOOLEAN", {"input": "checkbox", "use_custom_columns": True, "custom_labels": {"yes": "yes", "1": "no"}}),
    ("DATE", {'format': _too_long_string}),
    ("MONEY", {'currency_symbol': '$', 'currency_symbol_location': 'middle'}),
    ("MONEY", {'currency_symbol': None}),
    ("NUMERIC", {"show_as_percentage": "wrong value type"}),
    ("NUMERIC", {'number_format': "wrong"}),
    ("TIMESTAMP WITH TIME ZONE", {'format': []}),
    ("TIMESTAMP WITHOUT TIME ZONE", {'format': _too_long_string}),
    ("TIME WITH TIME ZONE", {'format': _too_long_string}),
    ("TIME WITHOUT TIME ZONE", {'format': {}}),
]


@pytest.mark.parametrize("type_,display_options", create_display_options_invalid_test_list)
def test_column_create_wrong_display_options(
        column_test_table, type_, display_options, client, engine
):
    cache.clear()
    name = "anewcolumn"
    data = {"name": name, "type": type_, "display_options": display_options}
    response = client.post(f"/api/db/v0/tables/{column_test_table.id}/columns/", data)
    assert response.status_code == 400


@pytest.mark.parametrize(
    "type_,type_options,expected_type_options",
    [
        ("NUMERIC", {"precision": 5, "scale": 3}, {"precision": 5, "scale": 3}),
        ("NUMERIC", {"scale": 3}, {"precision": 1000, "scale": 3}),
        ("VARCHAR", {"length": 5}, {"length": 5}),
        ("CHAR", {"length": 5}, {"length": 5}),
        ("INTERVAL", {"precision": 5}, {"precision": 5}),
        ("INTERVAL", {"precision": 5, "fields": "second"}, {"precision": 5, "fields": "second"}),
        ("INTERVAL", {"fields": "day"}, {"fields": "day"}),
    ]
)
def test_column_create_retrieve_options(column_test_table, client, type_, type_options, expected_type_options):
    name = "anewcolumn"
    cache.clear()
    num_columns = len(column_test_table.sa_columns)
    data = {
        "name": name, "type": type_, "type_options": type_options,
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/",
        data=data,
    )
    assert response.status_code == 201
    new_columns_response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/"
    )
    assert new_columns_response.json()["count"] == num_columns + 1
    actual_new_col = new_columns_response.json()["results"][-1]
    assert actual_new_col["name"] == name
    assert actual_new_col["type"] == type_
    assert actual_new_col["type_options"] == expected_type_options


invalid_type_options = [
    {"precision": 5, "scale": 8},
    {"precision": "asd"},
    {"nonoption": 34},
    {"length": "two"},
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
        f"/api/db/v0/tables/{column_test_table.id}/columns/",
        data=data,
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
        f"/api/db/v0/tables/{column_test_table.id}/columns/", data=data
    )
    assert response.status_code == 400


def test_column_create_some_parameters(column_test_table, client):
    data = {
        "name": "only name",
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/", data=data
    )
    response_data = response.json()[0]
    assert response.status_code == 400
    assert response_data['message'] == "This field is required."
    assert response_data['field'] == "type"


def test_column_create_no_name_parameter(column_test_table, client):
    cache.clear()
    type_ = "BOOLEAN"
    num_columns = len(column_test_table.sa_columns)
    generated_name = f"{COLUMN_NAME_TEMPLATE}{num_columns}"
    data = {
        "type": type_
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/", data=data
    )
    assert response.status_code == 201
    new_columns_response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/"
    )
    assert new_columns_response.json()["count"] == num_columns + 1
    actual_new_col = new_columns_response.json()["results"][-1]
    assert actual_new_col["name"] == generated_name
    assert actual_new_col["type"] == type_


def test_column_create_name_parameter_empty(column_test_table, client):
    cache.clear()
    name = ""
    type_ = "BOOLEAN"
    num_columns = len(column_test_table.sa_columns)
    generated_name = f"{COLUMN_NAME_TEMPLATE}{num_columns}"
    data = {
        "name": name, "type": type_
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/", data=data
    )
    assert response.status_code == 201
    new_columns_response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/"
    )
    assert new_columns_response.json()["count"] == num_columns + 1
    actual_new_col = new_columns_response.json()["results"][-1]
    assert actual_new_col["name"] == generated_name
    assert actual_new_col["type"] == type_


def test_column_update_name(column_test_table, client):
    cache.clear()
    name = "updatedname"
    data = {"name": name}
    column = _get_columns_by_name(column_test_table, ['mycolumn1'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/", data=data
    )
    assert response.status_code == 200
    assert response.json()["name"] == name
    response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/"
    )
    assert response.status_code == 200
    assert response.json()["name"] == name


def test_column_update_display_options(column_test_table_with_service_layer_options, client):
    cache.clear()
    table, columns = column_test_table_with_service_layer_options
    column_indexes = [2, 3, 4, 5]
    for column_index in column_indexes:
        colum_name = f"mycolumn{column_index}"
        column = _get_columns_by_name(table, [colum_name])[0]
        column_id = column.id
        display_options = {"input": "dropdown", "custom_labels": {"TRUE": "yes", "FALSE": "no"}, 'show_fk_preview': False}
        display_options_data = {"display_options": display_options, 'type': 'BOOLEAN', 'type_options': {}}
        response = client.patch(
            f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
            display_options_data,
        )
        assert response.json()["display_options"] == display_options


def test_column_update_type_with_existing_display_options(column_test_table_with_service_layer_options, client):
    cache.clear()
    table, columns = column_test_table_with_service_layer_options
    colum_name = "mycolumn2"
    column = _get_columns_by_name(table, [colum_name])[0]
    column_id = column.id
    display_options_data = {'type': 'BOOLEAN'}
    response = client.patch(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
        display_options_data,
    )
    assert response.json()["display_options"] is None


def test_column_update_type_invalid_display_options(column_test_table_with_service_layer_options, client):
    cache.clear()
    table, columns = column_test_table_with_service_layer_options
    colum_name = "mycolumn3"
    column = _get_columns_by_name(table, [colum_name])[0]
    column_id = column.id
    display_options_data = {'type': 'BOOLEAN', 'display_options': {}}
    response = client.patch(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
        display_options_data,
    )
    assert response.status_code == 400


def test_column_update_type_get_all_columns(column_test_table_with_service_layer_options, client):
    cache.clear()
    table, columns = column_test_table_with_service_layer_options
    colum_name = "mycolumn2"
    column = _get_columns_by_name(table, [colum_name])[0]
    column_id = column.id
    display_options_data = {'type': 'BOOLEAN'}
    client.patch(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
        display_options_data,
    )
    new_columns_response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/"
    )
    assert new_columns_response.status_code == 200


def test_column_display_options_type_on_reflection(
        column_test_table,
        client, engine
):
    cache.clear()
    table = column_test_table
    response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/",
    )
    columns = response.json()['results']
    for column in columns:
        assert column["display_options"] is None


def test_column_invalid_display_options_type_on_reflection(
        column_test_table_with_service_layer_options,
        client, engine
):
    cache.clear()
    table, columns = column_test_table_with_service_layer_options
    column_index = 2
    column = columns[column_index]
    with engine.begin() as conn:
        alter_column_type(table.oid, column.name, engine, conn, 'boolean')
    column_id = column.id
    response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
    )
    assert response.json()["display_options"] is None


def test_column_alter_same_type_display_options(
        column_test_table_with_service_layer_options,
        client, engine
):
    cache.clear()
    table, columns = column_test_table_with_service_layer_options
    column_index = 2
    column = columns[column_index]
    pre_alter_display_options = column.display_options
    with engine.begin() as conn:
        alter_column_type(table.oid, column.name, engine, conn, 'numeric')
    column_id = column.id
    response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
    )
    assert response.json()["display_options"] == pre_alter_display_options


def test_column_update_default(column_test_table, client):
    cache.clear()
    expt_default = 5
    data = {"default": {"value": expt_default}}  # Ensure we pass a int and not a str
    column = _get_columns_by_name(column_test_table, ['mycolumn0'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=json.dumps(data),
        content_type="application/json",
    )
    assert response.json()["default"]["value"] == expt_default


def test_column_update_delete_default(column_test_table, client):
    cache.clear()
    expt_default = None
    data = {"default": None}
    column = _get_columns_by_name(column_test_table, ['mycolumn0'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=data,
    )
    assert response.json()["default"] == expt_default


def test_column_update_default_invalid_cast(column_test_table, client):
    cache.clear()
    data = {"default": {"value": "not an integer"}}
    column = _get_columns_by_name(column_test_table, ['mycolumn0'])[0]

    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=json.dumps(data),
        content_type="application/json"
    )
    assert response.status_code == 400


def test_column_update_type_dynamic_default(column_test_table, client):
    cache.clear()
    type_ = "NUMERIC"
    data = {"type": type_}
    column = _get_columns_by_name(column_test_table, ['mycolumn0'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/", data=data
    )
    assert response.status_code == 400


def test_column_update_type(column_test_table, client):
    cache.clear()
    type_ = "BOOLEAN"
    data = {"type": type_}
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/", data=data
    )
    assert response.json()["type"] == type_


def test_column_update_name_and_type(column_test_table, client):
    cache.clear()
    type_ = "BOOLEAN"
    new_name = 'new name'
    data = {"type": type_, "name": new_name}
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/", data=data
    )
    assert response.json()["type"] == type_
    assert response.json()["name"] == new_name


def test_column_update_name_type_nullable(column_test_table, client):
    cache.clear()
    type_ = "BOOLEAN"
    new_name = 'new name'
    data = {"type": type_, "name": new_name, "nullable": True}
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]

    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/", data=data
    )
    assert response.json()["type"] == type_
    assert response.json()["name"] == new_name
    assert response.json()["nullable"] is True


def test_column_update_name_type_nullable_default(column_test_table, client):
    cache.clear()
    type_ = "BOOLEAN"
    new_name = 'new name'
    data = {
        "type": type_,
        "name": new_name,
        "nullable": True,
        "default": {"value": True},
    }
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.json()["type"] == type_
    assert response.json()["name"] == new_name
    assert response.json()["nullable"] is True
    assert response.json()["default"]["value"] is True


def test_column_update_type_options(column_test_table, client):
    cache.clear()
    type_ = "NUMERIC"
    type_options = {"scale": 1}
    expected_type_options = {'precision': 1000, 'scale': 1}
    data = {"type": type_, "type_options": type_options}
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data,
    )
    assert response.json()["type"] == type_
    assert response.json()["type_options"] == expected_type_options


def test_column_update_type_options_no_type(column_test_table, client):
    cache.clear()
    type_ = "NUMERIC"
    data = {"type": type_}
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]
    client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data,
    )
    type_options = {"precision": 3, "scale": 1}
    type_option_data = {"type_options": type_options}
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        type_option_data,
    )
    assert response.json()["type"] == type_
    assert response.json()["type_options"] == type_options


def test_column_update_invalid_type(create_table, client, engine_email_type):
    table = create_table('Column Invalid Type')
    body = {"type": "BIGINT"}
    response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/"
    )
    columns = response.json()['results']
    column_index = 3
    column_id = columns[column_index]['id']
    response = client.patch(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
        body
    )
    assert response.status_code == 400
    response_json = response.json()
    assert response_json[0]['code'] == ErrorCodes.InvalidTypeCast.value
    assert response_json[0]['message'] == "This type casting is invalid."


def test_column_update_returns_table_dependent_fields(column_test_table, client):
    cache.clear()
    expt_default = 5
    data = {"default": {"value": expt_default}}
    column = _get_columns_by_name(column_test_table, ['mycolumn1'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=data,
    )
    assert response.json()["default"] is not None
    assert response.json()["id"] is not None


@pytest.mark.parametrize("type_options", invalid_type_options)
def test_column_update_type_invalid_options(column_test_table, client, type_options):
    cache.clear()
    type_ = "NUMERIC"
    data = {"type": type_, "type_options": type_options}
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=data,
    )
    assert response.status_code == 400


def test_column_update_type_invalid_cast(column_test_table, client):
    cache.clear()
    type_ = "MATHESAR_TYPES.EMAIL"
    data = {"type": type_}
    column = _get_columns_by_name(column_test_table, ['mycolumn1'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/", data=data
    )
    assert response.status_code == 400


def test_column_update_when_missing(column_test_table, client):
    cache.clear()
    name = "updatedname"
    data = {"name": name}
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/99999/", data=data
    )
    assert response.status_code == 404
    response_data = response.json()[0]
    assert response_data['message'] == "Not found."
    assert response_data['code'] == ErrorCodes.NotFound.value


def test_column_destroy(column_test_table, client):
    cache.clear()
    num_columns = len(column_test_table.sa_columns)
    col_one_name = column_test_table.sa_columns[1].name
    column = _get_columns_by_name(column_test_table, ['mycolumn1'])[0]
    response = client.delete(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/"
    )
    assert response.status_code == 204
    new_columns_response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/"
    )
    new_data = new_columns_response.json()
    assert col_one_name not in [col["name"] for col in new_data["results"]]
    assert new_data["count"] == num_columns - 1


def test_column_destroy_when_missing(column_test_table, client):
    cache.clear()
    response = client.delete(
        f"/api/db/v0/tables/{column_test_table.id}/columns/99999/"
    )
    response_data = response.json()[0]
    assert response_data['message'] == "Not found."
    assert response_data['code'] == ErrorCodes.NotFound.value
    assert response.status_code == 404


def test_column_duplicate(column_test_table, client):
    cache.clear()
    column = _get_columns_by_name(column_test_table, ['mycolumn1'])[0]
    target_col = column_test_table.sa_columns[column.name]
    data = {
        "name": "new_col_name",
        "source_column": column.id,
        "copy_source_data": False,
        "copy_source_constraints": False,
    }
    with patch.object(models, "duplicate_column") as mock_infer:
        mock_infer.return_value = target_col
        response = client.post(
            f"/api/db/v0/tables/{column_test_table.id}/columns/",
            data=data
        )
    assert response.status_code == 201
    response_col = response.json()
    assert response_col["name"] == target_col.name
    assert response_col["type"] == target_col.plain_type

    assert mock_infer.call_args[0] == (
        column_test_table.oid,
        column,
        column_test_table.schema._sa_engine,
    )
    assert mock_infer.call_args[1] == {
        "new_column_name": data["name"],
        "copy_data": data["copy_source_data"],
        "copy_constraints": data["copy_source_constraints"]
    }


def test_column_duplicate_when_missing(column_test_table, client):
    data = {
        "source_column": 3000,
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/", data=data
    )
    assert response.status_code == 400
    response_data = response.json()[0]
    assert 2151 == response_data['code']
    assert "object does not exist" in response_data['message']


def test_column_duplicate_some_parameters(column_test_table, client):
    data = {
        "copy_source_constraints": True,
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/", data=data
    )
    response_data = response.json()
    assert response.status_code == 400
    assert response_data[0]['message'] == "This field is required."
    assert response_data[0]['field'] == "source_column"


def test_column_duplicate_no_parameters(column_test_table, client):
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/", data={}
    )
    response_data = response.json()
    assert response.status_code == 400
    assert response_data[0]["message"] == "This field is required."
    assert response_data[0]["field"] == "type"


def test_column_update_type_with_display_and_type_options_as_null(column_test_table, client):
    cache.clear()
    type_ = "MATHESAR_TYPES.URI"
    display_options = None
    type_options = None
    data = {
        "type": type_,
        "display_options": display_options,
        "type_options": type_options
    }
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=data,
    )
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["type"] == type_
    assert response_json["display_options"] == display_options
    assert response_json["type_options"] == type_options


def test_column_update_type_with_display_and_type_options_as_empty_objects(column_test_table, client):
    cache.clear()
    type_ = "MATHESAR_TYPES.URI"
    display_options = {}
    type_options = {}
    data = {
        "type": type_,
        "display_options": display_options,
        "type_options": type_options
    }
    column = _get_columns_by_name(column_test_table, ['mycolumn3'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=data,
    )
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["type"] == type_
    assert response_json["display_options"] == {'show_fk_preview': True}
    assert response_json["type_options"] is None
