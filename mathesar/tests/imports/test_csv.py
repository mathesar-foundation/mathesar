import pytest

from django.core.files import File
from sqlalchemy import text

from mathesar.models.base import DataFile, Schema
from mathesar.errors import InvalidTableError
from mathesar.imports.csv import create_table_from_csv, get_sv_dialect, get_sv_reader
from db.schemas.operations.create import create_schema
from db.schemas.utils import get_schema_oid_from_name
from db.constants import COLUMN_NAME_TEMPLATE
from db.tables.operations.create import DuplicateTable

TEST_SCHEMA = "import_csv_schema"


@pytest.fixture
def data_file(patents_csv_filepath):
    with open(patents_csv_filepath, "rb") as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    return data_file


@pytest.fixture
def long_column_data_file():
    data_filepath = 'mathesar/tests/data/long_column_names.csv'
    with open(data_filepath, "rb") as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    return data_file


@pytest.fixture
def headerless_data_file(headerless_patents_csv_filepath):
    with open(headerless_patents_csv_filepath, "rb") as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file), header=False)
    return data_file


@pytest.fixture
def col_names_with_spaces_data_file(col_names_with_spaces_csv_filepath):
    with open(col_names_with_spaces_csv_filepath, "rb") as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    return data_file


@pytest.fixture
def col_headers_empty_data_file(col_headers_empty_csv_filepath):
    with open(col_headers_empty_csv_filepath, "rb") as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    return data_file


@pytest.fixture()
def schema(engine, test_db_model):
    create_schema(TEST_SCHEMA, engine)
    schema_oid = get_schema_oid_from_name(TEST_SCHEMA, engine)
    yield Schema.current_objects.create(oid=schema_oid, database=test_db_model)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA "{TEST_SCHEMA}" CASCADE;'))


def check_csv_upload(table, table_name, schema, num_records, row, cols):
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == num_records
    assert table.get_records()[0] == row
    for col in cols:
        assert col in table.sa_column_names


def test_csv_upload(data_file, schema):
    table_name = "NASA 1"
    table = create_table_from_csv(data_file, table_name, schema)

    num_records = 1393
    expected_row = (
        1,
        "NASA Kennedy Space Center",
        "Application",
        "KSC-12871",
        "0",
        "13/033,085",
        "Polyimide Wire Insulation Repair System",
        None,
    )
    expected_cols = [
        "Center",
        "Status",
        "Case Number",
        "Patent Number",
        "Application SN",
        "Title",
        "Patent Expiration Date",
    ]
    check_csv_upload(
        table, table_name, schema, num_records, expected_row, expected_cols
    )


def test_csv_upload_long_columns(long_column_data_file, schema):
    table_name = "long_cols"
    table = create_table_from_csv(long_column_data_file, table_name, schema)

    num_records = 54
    expected_row = (
        1, 'NATION', '8.6', '4.5', '8.5', '4.3', '8.3', '4.6', '78.6', '2.22',
        '0.88', '0.66', '1.53', '3.75', '3.26', '0.45', '0.07', '53.9', '52.3',
        '0.8', '0.38487', '3.15796', '2.3', '33247', '14.842144', '6.172333',
        '47.158545', '1.698662', '2.345577', '7.882694', '0.145406', '3.395302',
        '92.085375', '14.447634', '78.873848', '1.738571', '16.161024',
        '19.436701', '8.145643', '94.937079', '74.115131', '75.601680',
        '22.073834', '11.791045', '1.585233', '1.016932', '2023-02-01',
    )
    expected_cols = [
        'id',
        'State or Nation',
        'Cycle 1 Total Number of Health Deficiencies',
        'Cycle 1 Total Number of Fire Safety Deficiencies',
        'Cycle 2 Total Number of Health Deficiencies',
        'Cycle 2 Total Number of Fire Safety Deficiencies',
        'Cycle 3 Total Number of Health Deficiencies',
        'Cycle 3 Total Number of Fire Safety Deficiencies',
        'Average Number of Residents per Day',
        'Reported Nurse Aide Staffing Hours per Resident per Day',
        'Reported LPN Staffing Hours per Resident per Day',
        'Reported RN Staffing Hours per Resident per Day',
        'Reported Licensed Staffing Hours per Resident per Day',
        'Reported Total Nurse Staffing Hours per Resident per Day',
        'Total number of nurse staff hours per resident per day-8cd5ab5e',
        'Registered Nurse hours per resident per day on the weekend',
        'Reported Physical Therapist Staffing Hours per Resident Per Day',
        'Total nursing staff turnover',
        'Registered Nurse turnover',
        'Number of administrators who have left the nursing home',
        'Case-Mix RN Staffing Hours per Resident per Day',
        'Case-Mix Total Nurse Staffing Hours per Resident per Day',
        'Number of Fines',
        'Fine Amount in Dollars',
        'Percentage of long stay residents whose need for help-5c97c88f',
        'Percentage of long stay residents who lose too much weight',
        'Percentage of low risk long stay residents who lose co-fc6bc241',
        'Percentage of long stay residents with a catheter inse-ce71f22a',
        'Percentage of long stay residents with a urinary tract-f16fbec8',
        'Percentage of long stay residents who have depressive symptoms',
        'Percentage of long stay residents who were physically-f30de0aa',
        'Percentage of long stay residents experiencing one or-9f9e8f36',
        'Percentage of long stay residents assessed and appropr-84744861',
        'Percentage of long stay residents who received an anti-20fe5d12',
        'Percentage of short stay residents assessed and approp-3568770f',
        'Percentage of short stay residents who newly received-e98612b4',
        'Percentage of long stay residents whose ability to mov-66839cb4',
        'Percentage of long stay residents who received an anti-868593e4',
        'Percentage of high risk long stay residents with press-b624bbba',
        'Percentage of long stay residents assessed and appropr-999c26ef',
        'Percentage of short stay residents who made improvemen-ebe5c21e',
        'Percentage of short stay residents who were assessed a-26e64965',
        'Percentage of short stay residents who were rehospital-682a4dae',
        'Percentage of short stay residents who had an outpatie-9403ec21',
        'Number of hospitalizations per 1000 long-stay resident days',
        'Number of outpatient emergency department visits per 1-f0fed7b5',
        'Processing Date'
    ]
    check_csv_upload(
        table, table_name, schema, num_records, expected_row, expected_cols
    )


def test_headerless_csv_upload(headerless_data_file, schema):
    table_name = "NASA no headers"
    table = create_table_from_csv(headerless_data_file, table_name, schema)

    num_records = 1393
    expected_row = (
        1,
        "NASA Kennedy Space Center",
        "Application",
        "KSC-12871",
        "0",
        "13/033,085",
        "Polyimide Wire Insulation Repair System",
        None,
    )
    expected_cols = [COLUMN_NAME_TEMPLATE + str(i) for i in range(7)]

    check_csv_upload(
        table, table_name, schema, num_records, expected_row, expected_cols
    )


def test_col_names_with_spaces_csv(col_names_with_spaces_data_file, schema):
    table_name = "Column names with spaces"
    table = create_table_from_csv(col_names_with_spaces_data_file, table_name, schema)

    num_records = 2
    expected_row = (
        1,
        "foo",
        "bar",
    )
    expected_cols = ["id", "a", "b"]

    check_csv_upload(
        table, table_name, schema, num_records, expected_row, expected_cols
    )


def test_col_headers_empty_csv(col_headers_empty_data_file, schema):
    table_name = "Empty column header"
    table = create_table_from_csv(col_headers_empty_data_file, table_name, schema)

    num_records = 2
    expected_row = (1, "aa", "bb", "cc", "dd")
    expected_cols = ["id", "Column 0", "Column 1", "col2", "Column 3"]

    check_csv_upload(
        table, table_name, schema, num_records, expected_row, expected_cols
    )


def test_csv_upload_with_duplicate_table_name(data_file, schema):
    table_name = "NASA 2"

    table = create_table_from_csv(data_file, table_name, schema)
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 1393

    with pytest.raises(DuplicateTable):
        create_table_from_csv(data_file, table_name, schema)


def test_csv_upload_table_imported_to(data_file, schema):
    table = create_table_from_csv(data_file, "NASA", schema)
    data_file.refresh_from_db()
    assert data_file.table_imported_to == table


get_dialect_test_list = [
    (",", '"', "", "mathesar/tests/data/patents.csv"),
    ("\t", '"', "", "mathesar/tests/data/patents.tsv"),
    (",", "'", "", "mathesar/tests/data/csv_parsing/mixed_quote.csv"),
    (",", '"', "", "mathesar/tests/data/csv_parsing/double_quote.csv"),
    (",", '"', "\\", "mathesar/tests/data/csv_parsing/escaped_quote.csv"),
]


@pytest.mark.parametrize("exp_delim,exp_quote,exp_escape,file", get_dialect_test_list)
def test_sv_get_dialect(exp_delim, exp_quote, exp_escape, file):
    with open(file, "r") as sv_file:
        dialect = get_sv_dialect(sv_file)
    assert dialect.delimiter == exp_delim
    assert dialect.quotechar == exp_quote
    assert dialect.escapechar == exp_escape


get_dialect_exceptions_test_list = [
    "mathesar/tests/data/csv_parsing/patents_invalid.csv",
    "mathesar/tests/data/csv_parsing/extra_quote_invalid.csv",
    "mathesar/tests/data/csv_parsing/escaped_quote_invalid.csv",
]


@pytest.mark.parametrize("file", get_dialect_exceptions_test_list)
def test_sv_get_dialect_exceptions(file):
    with pytest.raises(InvalidTableError):
        with open(file, "r") as sv_file:
            get_sv_dialect(sv_file)


get_header_test_list = [
    "mathesar/tests/data/csv_parsing/double_quote_in_header.csv",
]


@pytest.mark.parametrize("file", get_header_test_list)
def test_sv_get_header(file):
    with open(file, "rb") as sv_file:
        table = get_sv_reader(file=sv_file, header=True)
        assert table.fieldnames == [
            "\"Center \"NASA\" USA\"",
            "\"Status\"",
            "\"Case Number\"",
            "\"Patent Number\"",
            "\"Application SN\"",
            "\"Title,Patent Expiration Date\"",
        ]
