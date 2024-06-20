import pytest

from django.core.files import File
from sqlalchemy import text

from mathesar.models.deprecated import DataFile, Schema
from mathesar.imports.base import create_table_from_data_file
from db.schemas.operations.create import create_schema_via_sql_alchemy
from db.schemas.utils import get_schema_oid_from_name
from psycopg.errors import DuplicateTable

TEST_SCHEMA = "import_json_schema"


@pytest.fixture
def data_file(patents_json_filepath):
    with open(patents_json_filepath, "rb") as json_file:
        data_file = DataFile.objects.create(file=File(json_file), type='json')
    return data_file


@pytest.fixture()
def schema(engine, test_db_model):
    create_schema_via_sql_alchemy(TEST_SCHEMA, engine)
    schema_oid = get_schema_oid_from_name(TEST_SCHEMA, engine)
    yield Schema.current_objects.create(oid=schema_oid, database=test_db_model)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA "{TEST_SCHEMA}" CASCADE;'))


def check_json_upload(table, table_name, schema, num_records, row, cols):
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == num_records
    assert table.get_records()[0] == row
    for col in cols:
        assert col in table.sa_column_names


def test_json_upload(data_file, schema):
    table_name = "NASA 1"
    table = create_table_from_data_file(data_file, table_name, schema)

    num_records = 1393
    expected_row = (
        1,
        "NASA Kennedy Space Center",
        "Application",
        "KSC-12871",
        "0",
        "13/033,085",
        "Polyimide Wire Insulation Repair System",
        '',
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
    check_json_upload(
        table, table_name, schema, num_records, expected_row, expected_cols
    )


def test_json_upload_with_duplicate_table_name(data_file, schema):
    table_name = "NASA 2"

    table = create_table_from_data_file(data_file, table_name, schema)
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 1393

    with pytest.raises(DuplicateTable):
        create_table_from_data_file(data_file, table_name, schema)


def test_json_upload_table_imported_to(data_file, schema):
    table = create_table_from_data_file(data_file, "NASA", schema)
    data_file.refresh_from_db()
    assert data_file.table_imported_to == table
