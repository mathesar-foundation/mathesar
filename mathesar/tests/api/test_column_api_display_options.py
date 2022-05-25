import pytest

from sqlalchemy import INTEGER, BOOLEAN, TEXT, TIMESTAMP, Column, Table as SATable, MetaData, TIME, DATE

from db.columns.operations.alter import alter_column_type
from db.columns.operations.select import get_column_attnum_from_name
from db.tables.operations.select import get_oid_from_table
from db.types.base import PostgresType, MathesarCustomType
from db.types.custom.money import MathesarMoney

from mathesar import models


@pytest.fixture
def column_test_table_with_service_layer_options(patent_schema):
    engine = patent_schema._sa_engine
    column_list_in = [
        Column("mycolumn0", INTEGER, primary_key=True),
        Column("mycolumn1", BOOLEAN),
        Column("mycolumn2", INTEGER),
        Column("mycolumn3", TEXT),
        Column("mycolumn4", TEXT),
        Column("mycolumn5", MathesarMoney),
        Column("mycolumn6", TIMESTAMP),
        Column("mycolumn7", TIME),
        Column("mycolumn8", DATE),
    ]
    column_data_list = [
        {},
        {'display_options': {'input': "dropdown", "custom_labels": {"TRUE": "yes", "FALSE": "no"}}},
        {'display_options': {'show_as_percentage': True, 'number_format': "english"}},
        {'display_options': None},
        {},
        {
            'display_options': {
                'currency_details': {
                    'currency_symbol': "HK $",
                    'number_format': "english",
                    'currency_symbol_location': 'after-minus'
                }
            }
        },
        {'display_options': {'time_format': 'hh:mm', 'date_format': 'YYYY-MM-DD'}},
        {'display_options': {'format': 'hh:mm'}},
        {'display_options': {'format': 'YYYY-MM-DD'}},
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
            models.Column.current_objects.get_or_create(
                table=table,
                attnum=attnum,
                display_options=column_data[1].get('display_options', None)
            )[0]
        )
    return table, service_columns


# NOTE: display option value types are checked backend, but that's it: e.g. a time format may be any string.
_create_display_options_test_list = [
    (
        PostgresType.BOOLEAN,
        {"input": "dropdown"},
        {"input": "dropdown"}
    ),
    (
        PostgresType.BOOLEAN,
        {"input": "checkbox", "custom_labels": {"TRUE": "yes", "FALSE": "no"}},
        {"input": "checkbox", "custom_labels": {"TRUE": "yes", "FALSE": "no"}}
    ),
    (
        PostgresType.DATE,
        {'format': 'YYYY-MM-DD'},
        {'format': 'YYYY-MM-DD'}
    ),
    (
        PostgresType.INTERVAL,
        {'min': 's', 'max': 'h', 'show_units': True},
        {'min': 's', 'max': 'h', 'show_units': True}
    ),
    (
        PostgresType.MONEY,
        {'number_format': "english", 'currency_symbol': '$', 'currency_symbol_location': 'after-minus'},
        {'currency_symbol': '$', 'currency_symbol_location': 'after-minus', 'number_format': "english"}
    ),
    (
        PostgresType.NUMERIC,
        {"show_as_percentage": True, 'number_format': None},
        {"show_as_percentage": True, 'number_format': None}
    ),
    (
        PostgresType.NUMERIC,
        {"show_as_percentage": True, 'number_format': "english"},
        {"show_as_percentage": True, 'number_format': "english"}
    ),
    (
        PostgresType.TIMESTAMP_WITH_TIME_ZONE,
        {'date_format': 'x', 'time_format': 'x'},
        {'date_format': 'x', 'time_format': 'x'}
    ),
    (
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
        {'date_format': 'x', 'time_format': 'x'},
        {'date_format': 'x', 'time_format': 'x'}
    ),
    (
        PostgresType.TIME_WITHOUT_TIME_ZONE,
        {'format': 'hh:mm'},
        {'format': 'hh:mm'}
    ),
    (
        PostgresType.TIME_WITH_TIME_ZONE,
        {'format': 'hh:mm Z'},
        {'format': 'hh:mm Z'}
    ),
]


# TODO does it make sense to do two HTTP requests here?
@pytest.mark.parametrize(
    "db_type,display_options,expected_display_options",
    _create_display_options_test_list
)
def test_column_create_display_options(
    column_test_table, db_type, display_options, expected_display_options, client
):
    name = "anewcolumn"
    data = {"name": name, "type": db_type.id, "display_options": display_options}

    response = client.post(f"/api/db/v0/tables/{column_test_table.id}/columns/", data)
    assert response.status_code == 201

    # Ensure the correct serialized date is returned by the API
    new_columns_response = client.get(
        f"/api/db/v0/tables/{column_test_table.id}/columns/"
    )
    assert new_columns_response.status_code == 200
    columns = new_columns_response.json()["results"]

    # We have to find the new column.
    new_column = None
    for column in columns:
        if column['name'] == name:
            new_column = column

    assert new_column is not None
    assert new_column["display_options"] == expected_display_options


_too_long_string = "x" * 256


_create_display_options_invalid_test_list = [
    (
        PostgresType.BOOLEAN,
        {"input": "invalid", "use_custom_columns": False}
    ),
    (
        PostgresType.BOOLEAN,
        {
            "input": "checkbox",
            "use_custom_columns": True,
            "custom_labels": {"yes": "yes", "1": "no"}}
    ),
    (
        PostgresType.DATE,
        {'format': _too_long_string}
    ),
    (
        PostgresType.MONEY,
        {'currency_symbol': '$', 'currency_symbol_location': 'middle'}
    ),
    (
        PostgresType.MONEY,
        {'currency_symbol': None}
    ),
    (
        PostgresType.NUMERIC,
        {"show_as_percentage": "wrong value type"}
    ),
    (
        PostgresType.NUMERIC,
        {'number_format': "wrong"}
    ),
    (
        PostgresType.TIMESTAMP_WITH_TIME_ZONE,
        {'format': []}
    ),
    (
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
        {'format': _too_long_string}
    ),
    (
        PostgresType.TIME_WITH_TIME_ZONE,
        {'format': _too_long_string}
    ),
    (
        PostgresType.TIME_WITHOUT_TIME_ZONE,
        {'format': {}}
    ),
]


@pytest.mark.parametrize("db_type,display_options", _create_display_options_invalid_test_list)
def test_column_create_wrong_display_options(
    column_test_table, db_type, display_options, client
):
    name = "anewcolumn"
    data = {"name": name, "type": db_type.id, "display_options": display_options}
    response = client.post(f"/api/db/v0/tables/{column_test_table.id}/columns/", data)
    assert response.status_code == 400


def test_column_update_display_options(column_test_table_with_service_layer_options, client):
    table, _ = column_test_table_with_service_layer_options
    column_indexes = [2, 3, 4, 5]
    for column_index in column_indexes:
        colum_name = f"mycolumn{column_index}"
        column = table.get_columns_by_name([colum_name])[0]
        column_id = column.id
        display_options = {
            "input": "dropdown",
            "custom_labels": {"TRUE": "yes", "FALSE": "no"}
        }
        column_data = {
            'type': PostgresType.BOOLEAN.id,
            'type_options': {},
            'display_options': display_options,
        }
        response = client.patch(
            f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
            column_data,
        )
        assert response.status_code == 200
        assert response.json()["display_options"] == display_options


def test_column_update_type_with_existing_display_options(column_test_table_with_service_layer_options, client):
    table, _ = column_test_table_with_service_layer_options
    colum_name = "mycolumn2"
    column = table.get_columns_by_name([colum_name])[0]
    column_id = column.id
    column_data = {'type': PostgresType.BOOLEAN.id}
    response = client.patch(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
        column_data,
    )
    assert response.status_code == 200
    assert response.json()["display_options"] is None


def test_column_update_type_invalid_display_options(column_test_table_with_service_layer_options, client):
    table, _ = column_test_table_with_service_layer_options
    colum_name = "mycolumn3"
    column = table.get_columns_by_name([colum_name])[0]
    column_id = column.id
    display_options_data = {'type': 'BOOLEAN', 'display_options': {}}
    response = client.patch(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
        display_options_data,
    )
    assert response.status_code == 400


def test_column_display_options_type_on_reflection(
    column_test_table, client
):
    table = column_test_table
    response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/",
    )
    columns = response.json()['results']
    for column in columns:
        assert column["display_options"] is None


def test_column_invalid_display_options_type_on_reflection(
    column_test_table_with_service_layer_options, client, engine
):
    table, columns = column_test_table_with_service_layer_options
    column_index = 2
    column = columns[column_index]
    with engine.begin() as conn:
        alter_column_type(table.oid, column.name, engine, conn, PostgresType.BOOLEAN)
    column_id = column.id
    response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
    )
    assert response.json()["display_options"] is None


def test_column_alter_same_type_display_options(
    column_test_table_with_service_layer_options,
    client, engine
):
    table, columns = column_test_table_with_service_layer_options
    column_index = 2
    column = columns[column_index]
    pre_alter_display_options = column.display_options
    with engine.begin() as conn:
        alter_column_type(table.oid, column.name, engine, conn, PostgresType.NUMERIC)
    column_id = column.id
    response = client.get(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/",
    )
    assert response.json()["display_options"] == pre_alter_display_options


@pytest.mark.parametrize(
    "display_options,type_options",
    [[None, None], [{}, {}]]
)
def test_column_update_type_with_display_and_type_options_as_null_or_empty_obj(
    column_test_table, client, display_options, type_options
):
    db_type_id = MathesarCustomType.URI.id
    data = {
        "type": db_type_id,
        "display_options": display_options,
        "type_options": type_options
    }
    column = column_test_table.get_columns_by_name(['mycolumn3'])[0]
    response = client.patch(
        f"/api/db/v0/tables/{column_test_table.id}/columns/{column.id}/",
        data=data,
    )
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["type"] == db_type_id
    assert response_json["display_options"] == display_options
    # For some reason, type_options will reflect None, whether it was updated to None or to {}.
    assert response_json["type_options"] is None
