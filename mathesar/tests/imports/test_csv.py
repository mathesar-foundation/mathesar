import pytest

from django.core.files import File
from sqlalchemy.exc import ProgrammingError
from sqlalchemy import text

from mathesar.models.base import DataFile, Schema
from mathesar.errors import InvalidTableError
from mathesar.imports.csv import create_table_from_csv, get_sv_dialect, get_sv_reader
from db.schemas.operations.create import create_schema
from db.schemas.utils import get_schema_oid_from_name
from db.constants import COLUMN_NAME_TEMPLATE

TEST_SCHEMA = "import_csv_schema"


@pytest.fixture
def data_file(patents_csv_filepath):
    with open(patents_csv_filepath, "rb") as csv_file:
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
    assert all([col in table.sa_column_names for col in cols])


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
    already_defined_str = 'relation "NASA 2" already exists'

    table = create_table_from_csv(data_file, table_name, schema)
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 1393

    with pytest.raises(ProgrammingError) as excinfo:
        create_table_from_csv(data_file, table_name, schema)
    assert already_defined_str in str(excinfo.value)


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
