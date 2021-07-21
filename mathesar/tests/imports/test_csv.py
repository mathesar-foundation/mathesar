import pytest

from django.core.files import File
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy import text

from mathesar.imports.csv import create_table_from_csv
from mathesar.models import DataFile, Schema
from db.schemas import create_schema, get_schema_oid_from_name

TEST_SCHEMA = 'import_csv_schema'


@pytest.fixture
def data_file(csv_filename):
    with open(csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    return data_file


@pytest.fixture
def headerless_data_file(headerless_csv_filename):
    with open(headerless_csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    data_file.header = False
    data_file.save()
    return data_file


@pytest.fixture()
def schema(engine, test_db_model):
    create_schema(TEST_SCHEMA, engine)
    schema_oid = get_schema_oid_from_name(TEST_SCHEMA, engine)
    yield Schema.objects.create(oid=schema_oid, database=test_db_model)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA "{TEST_SCHEMA}" CASCADE;'))


def test_csv_upload(data_file, schema):
    table_name = 'NASA 1'
    table = create_table_from_csv(data_file, table_name, schema)
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 1393


def test_headerless_csv_upload(headerless_data_file, schema):
    table_name = 'NASA no headers'
    table = create_table_from_csv(
        headerless_data_file, table_name, schema
    )
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 1393


def test_csv_upload_with_duplicate_table_name(data_file, schema):
    table_name = 'NASA 2'
    already_defined_str = (
        f"Table '{schema.name}.{table_name}' is already defined"
    )

    table = create_table_from_csv(data_file, table_name, schema)
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 1393

    with pytest.raises(InvalidRequestError) as excinfo:
        create_table_from_csv(data_file, table_name, schema)
        assert already_defined_str in str(excinfo)


def test_csv_upload_table_imported_to(data_file, schema):
    table = create_table_from_csv(data_file, 'NASA', schema)
    data_file.refresh_from_db()
    assert data_file.table_imported_to == table
