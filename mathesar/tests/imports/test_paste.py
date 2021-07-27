import pytest

from sqlalchemy.exc import InvalidRequestError
from sqlalchemy import text

from mathesar.models import Schema
from mathesar.errors import InvalidPasteError
from mathesar.imports.paste import create_table_from_paste, validate_paste
from db.schemas import create_schema, get_schema_oid_from_name


TEST_SCHEMA = 'import_paste_schema'


@pytest.fixture(scope='module')
def paste_text(paste_filename):
    with open(paste_filename, 'r') as paste_file:
        paste_data = paste_file.read()
    return paste_data


@pytest.fixture()
def schema(engine, test_db_model):
    create_schema(TEST_SCHEMA, engine)
    schema_oid = get_schema_oid_from_name(TEST_SCHEMA, engine)
    yield Schema.objects.create(oid=schema_oid, database=test_db_model)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA "{TEST_SCHEMA}" CASCADE;'))


def test_paste_upload(paste_text, schema):
    table_name = 'NASA 1'
    table = create_table_from_paste(paste_text, table_name, schema)
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 13


def test_paste_upload_with_duplicate_table_name(paste_text, schema):
    table_name = 'NASA 2'
    already_defined_str = (
        f"Table '{schema.name}.{table_name}' is already defined"
    )

    table = create_table_from_paste(paste_text, table_name, schema)
    assert table is not None
    assert table.name == table_name
    assert table.schema == schema
    assert table.sa_num_records() == 13

    with pytest.raises(InvalidRequestError) as excinfo:
        create_table_from_paste(paste_text, table_name, schema)
        assert already_defined_str in str(excinfo)


validate_paste_test_list = [
    (
        ['Center', 'Status', 'Case Number'],
        [['NASA Ames Research Center', 'Issued', 'ARC-14048-1']],
        'mathesar/tests/data/paste_parsing/base.txt',
    ),
    (
        ['Center', 'Status', 'Case Number'],
        [['', 'Issued', 'ARC-14048-1']],
        'mathesar/tests/data/paste_parsing/missing_start_col.txt',
    ),
    (
        ['Center', 'Status', 'Case Number'],
        [['NASA Ames Research Center', '', 'ARC-14048-1']],
        'mathesar/tests/data/paste_parsing/missing_middle_col.txt',
    ),
    (
        ['Center', 'Status', 'Case Number'],
        [['NASA Ames Research Center', 'Issued', '']],
        'mathesar/tests/data/paste_parsing/missing_end_col.txt',
    ),
    (
        ['Center', 'Status', 'Case Number'],
        [['NASA Ames Research Center', '', '']],
        'mathesar/tests/data/paste_parsing/missing_multiple_col.txt',
    ),
]


@pytest.mark.parametrize("exp_names,exp_line,file", validate_paste_test_list)
def test_validate_paste(exp_names, exp_line, file):
    with open(file, 'r') as paste_file:
        paste_text = paste_file.read()
        col_names, lines = validate_paste(paste_text)
    assert col_names == exp_names
    assert lines == exp_line


validate_paste_exceptions_test_list = [
    ('mathesar/tests/data/paste_parsing/missing_header_invalid.csv'),
    ('mathesar/tests/data/paste_parsing/missing_col_invalid.csv'),
    ('mathesar/tests/data/paste_parsing/empty_invalid.csv'),
]


@pytest.mark.parametrize("file", validate_paste_exceptions_test_list)
def test_sv_get_dialect_exceptions(file):
    with pytest.raises(InvalidPasteError):
        with open(file, 'r') as paste_file:
            paste_text = paste_file.read()
            validate_paste(paste_text)
