import pytest

from sqlalchemy.sql import text

from django.core.files.base import File

from db.types.base import PostgresType
from db.identifiers import truncate_if_necessary, POSTGRES_IDENTIFIER_SIZE_LIMIT

from mathesar.api.exceptions.database_exceptions import (
    exceptions as database_api_exceptions
)
from mathesar.models.deprecated import DataFile

from mathesar.tests.api.test_table_api import check_create_table_response, get_expected_name


def _get_string_of_length(n):
    def return_a_character(_):
        return 'x'
    return ''.join(map(return_a_character, range(n)))


@pytest.fixture
def long_column_data_file():
    data_filepath = 'mathesar/tests/data/long_column_names.csv'
    with open(data_filepath, "rb") as csv_file:
        data_file = DataFile.objects.create(
            file=File(csv_file),
            created_from='file',
            base_name='longdatafiled',
            type='csv'
        )
    return data_file


@pytest.fixture
def dj_model_of_preexisting_db(worker_id, FUN_create_dj_db, FUN_engine_cache):
    db_name = f"preexisting_db_{worker_id}"
    db_model = FUN_create_dj_db(db_name)
    engine = FUN_engine_cache(db_name)
    max_length_identifier = _get_string_of_length(
        POSTGRES_IDENTIFIER_SIZE_LIMIT
    )
    with engine.connect() as con:
        statement = text(f"""
            CREATE TABLE public.persons (
                {max_length_identifier} INT PRIMARY KEY
            );
        """)
        con.execute(statement)
        con.commit()
    return db_model


def test_long_identifier_in_prexisting_db(dj_model_of_preexisting_db, client):  # noqa: F841
    """
    Checks that the table and column endpoints work for a third-party db with
    an identifier that has maximum length supported by Postgres.
    """
    response = client.get("/api/db/v0/tables/")
    json = response.json()
    assert response.status_code == 200
    assert json['count'] == 1
    table_json = json['results'][0]
    assert table_json['name'] == 'persons'
    table_id = table_json['id']
    response = client.get(
        f"/api/db/v0/tables/{table_id}/columns/",
    )
    json = response.json()
    assert response.status_code == 200
    column_json = json['results'][0]
    column_id = column_json['id']
    assert len(column_json['name']) == POSTGRES_IDENTIFIER_SIZE_LIMIT
    db_type = PostgresType.BOOLEAN
    data = {"type": db_type.id}
    response = client.patch(
        f"/api/db/v0/tables/{table_id}/columns/{column_id}/", data=data
    )
    assert response.status_code == 200
    json = response.json()
    column_json = json
    assert len(column_json['name']) == POSTGRES_IDENTIFIER_SIZE_LIMIT


def test_column_create_with_long_column_name(column_test_table, client):
    very_long_string = ''.join(map(str, range(50)))
    name = 'very_long_identifier_' + very_long_string
    db_type = PostgresType.NUMERIC
    data = {
        "name": name,
        "type": db_type.id,
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/columns/",
        data=data,
    )
    assert response.status_code == 400
    assert response.json()[0]['code'] == database_api_exceptions.IdentifierTooLong.error_code


@pytest.mark.parametrize(
    'before_truncation, after_truncation',
    [
        [
            "bbbbbbbbbbbbbb",
            "bbbbbbbbbbbbbb",
        ],
        [
            "cccccccccccccccccccccc",
            "cccccccccccccccccccccc",
        ],
        [
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        ],
        [
            "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            "fffffffffffffffffffffffffffffffffffffff-7e43d30e"
        ],
        [
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-d0ccef3c",
        ],
        [
            "ggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
            "ggggggggggggggggggggggggggggggggggggggg-2910cecf",
        ],
    ]
)
def test_truncate_if_necessary(before_truncation, after_truncation):
    assert truncate_if_necessary(before_truncation) == after_truncation


def test_create_table_long_name_data_file(client, long_column_data_file, create_schema, uid):
    table_name = 'My Long column name datafile'
    # response, response_table, table = _create_table(
    # )
    expt_name = get_expected_name(table_name, data_file=long_column_data_file)
    first_row = (
        1, 'NATION', '8.6', '4.5', '8.5', '4.3', '8.3', '4.6', '78.6', '2.22',
        '0.88', '0.66', '1.53', '3.75', '3.26', '0.45', '0.07', '53.9', '52.3',
        '0.8', '0.38487', '3.15796', '2.3', '33247', '14.842144', '6.172333',
        '47.158545', '1.698662', '2.345577', '7.882694', '0.145406', '3.395302',
        '92.085375', '14.447634', '78.873848', '1.738571', '16.161024',
        '19.436701', '8.145643', '94.937079', '74.115131', '75.601680',
        '22.073834', '11.791045', '1.585233',
        '1.016932', '2023-02-01'
    )
    column_names = [
        "State or Nation",
        "Cycle 1 Total Number of Health Deficiencies",
        "Cycle 1 Total Number of Fire Safety Deficiencies",
        "Cycle 2 Total Number of Health Deficiencies",
        "Cycle 2 Total Number of Fire Safety Deficiencies",
        "Cycle 3 Total Number of Health Deficiencies",
        "Cycle 3 Total Number of Fire Safety Deficiencies",
        "Average Number of Residents per Day",
        "Reported Nurse Aide Staffing Hours per Resident per Day",
        "Reported LPN Staffing Hours per Resident per Day",
        "Reported RN Staffing Hours per Resident per Day",
        "Reported Licensed Staffing Hours per Resident per Day",
        "Reported Total Nurse Staffing Hours per Resident per Day",
        "Total number of nurse staff hours per resident per day on the weekend",
        "Registered Nurse hours per resident per day on the weekend",
        "Reported Physical Therapist Staffing Hours per Resident Per Day",
        "Total nursing staff turnover",
        "Registered Nurse turnover",
        "Number of administrators who have left the nursing home",
        "Case-Mix RN Staffing Hours per Resident per Day",
        "Case-Mix Total Nurse Staffing Hours per Resident per Day",
        "Number of Fines",
        "Fine Amount in Dollars",
        "Percentage of long stay residents whose need for help with daily activities has increased",
        "Percentage of long stay residents who lose too much weight",
        "Percentage of low risk long stay residents who lose control of their bowels or bladder",
        "Percentage of long stay residents with a catheter inserted and left in their bladder",
        "Percentage of long stay residents with a urinary tract infection",
        "Percentage of long stay residents who have depressive symptoms",
        "Percentage of long stay residents who were physically restrained",
        "Percentage of long stay residents experiencing one or more falls with major injury",
        "Percentage of long stay residents assessed and appropriately given the pneumococcal vaccine",
        "Percentage of long stay residents who received an antipsychotic medication",
        "Percentage of short stay residents assessed and appropriately given the pneumococcal vaccine",
        "Percentage of short stay residents who newly received an antipsychotic medication",
        "Percentage of long stay residents whose ability to move independently worsened",
        "Percentage of long stay residents who received an antianxiety or hypnotic medication",
        "Percentage of high risk long stay residents with pressure ulcers",
        "Percentage of long stay residents assessed and appropriately given the seasonal influenza vaccine",
        "Percentage of short stay residents who made improvements in function",
        "Percentage of short stay residents who were assessed and appropriately given the seasonal influenza vaccine",
        "Percentage of short stay residents who were rehospitalized after a nursing home admission",
        "Percentage of short stay residents who had an outpatient emergency department visit",
        "Number of hospitalizations per 1000 long-stay resident days",
        "Number of outpatient emergency department visits per 1000 long-stay resident days",
        "Processing Date"
    ]
    # Make sure at least some column names require truncation;
    # 63 is the hard Postgres limit; we're also experiencing problems with ids
    # as short as 58 characters, but I'll leave this at 63 so that it doesn't
    # have to be updated once that's fixed.
    assert any(
        len(column_name) >= 63
        for column_name
        in column_names
    )
    processed_column_names = [truncate_if_necessary(col) for col in column_names]
    schema = create_schema(uid)
    table = check_create_table_response(
        client, table_name, expt_name, long_column_data_file, schema, first_row,
        processed_column_names, import_target_table=None
    )
    # This just makes sure we can get records. This was a bug with long column names.
    response = client.get(f'/api/db/v0/tables/{table.id}/records/')
    assert response.status_code == 200
