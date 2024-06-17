import pytest

from django.core.files import File

from mathesar.models.deprecated import DataFile, Schema
from mathesar.imports.base import create_table_from_data_file
from db.schemas.utils import get_schema_oid_from_name
from psycopg.errors import DuplicateTable


@pytest.fixture
def data_file(patents_excel_filepath):
    with open(patents_excel_filepath, "rb") as excel_file:
        data_file = DataFile.objects.create(file=File(excel_file), type='excel')
    return data_file


def check_excel_upload(table, table_name, schema, num_records, row, cols):
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == num_records
    assert table.get_records()[0] == row
    for col in cols:
        assert col in table.sa_column_names


def test_excel_upload(data_file, engine_with_schema):
    engine, schema_name = engine_with_schema
    schema_oid = get_schema_oid_from_name(schema_name, engine)
    schema = Schema.objects.get(oid=schema_oid)
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
    check_excel_upload(
        table, table_name, schema, num_records, expected_row, expected_cols
    )


def test_excel_upload_with_duplicate_table_name(data_file, engine_with_schema):
    table_name = "NASA 2"

    engine, schema_name = engine_with_schema
    schema_oid = get_schema_oid_from_name(schema_name, engine)
    schema = Schema.objects.get(oid=schema_oid)
    table = create_table_from_data_file(data_file, table_name, schema)
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 1393

    with pytest.raises(DuplicateTable):
        create_table_from_data_file(data_file, table_name, schema)


def test_excel_upload_table_imported_to(data_file, engine_with_schema):
    engine, schema_name = engine_with_schema
    schema_oid = get_schema_oid_from_name(schema_name, engine)
    schema = Schema.objects.get(oid=schema_oid)
    table = create_table_from_data_file(data_file, "NASA", schema)
    data_file.refresh_from_db()
    assert data_file.table_imported_to == table
