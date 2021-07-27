import pytest

from django.core.files import File
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy import text

from mathesar.models import DataFile, Schema
from mathesar.errors import InvalidTableError
from mathesar.imports.csv import create_table_from_csv, get_sv_dialect
from db.schemas import create_schema, get_schema_oid_from_name

TEST_SCHEMA = 'import_csv_schema'


@pytest.fixture
def data_file(csv_filename):
    with open(csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
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


get_dialect_test_list = [
    (',', '"', '', 'mathesar/tests/data/patents.csv'),
    ('\t', '"', '', 'mathesar/tests/data/patents.tsv'),
    (',', "'", '', 'mathesar/tests/data/csv_parsing/mixed_quote.csv'),
    (',', '"', '', 'mathesar/tests/data/csv_parsing/double_quote.csv'),
    (',', '"', '\\', 'mathesar/tests/data/csv_parsing/escaped_quote.csv'),
]


@pytest.mark.parametrize("exp_delim,exp_quote,exp_escape,file", get_dialect_test_list)
def test_sv_get_dialect(exp_delim, exp_quote, exp_escape, file):
    with open(file, 'r') as sv_file:
        dialect = get_sv_dialect(sv_file)
    assert dialect.delimiter == exp_delim
    assert dialect.quotechar == exp_quote
    assert dialect.escapechar == exp_escape


get_dialect_exceptions_test_list = [
    ('mathesar/tests/data/csv_parsing/patents_invalid.csv'),
    ('mathesar/tests/data/csv_parsing/extra_quote_invalid.csv'),
    ('mathesar/tests/data/csv_parsing/escaped_quote_invalid.csv'),
]


@pytest.mark.parametrize("file", get_dialect_exceptions_test_list)
def test_sv_get_dialect_exceptions(file):
    with pytest.raises(InvalidTableError):
        with open(file, 'r') as sv_file:
            get_sv_dialect(sv_file)
