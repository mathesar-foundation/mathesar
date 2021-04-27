import pytest

from sqlalchemy.exc import ProgrammingError

from mathesar.imports.csv import create_table_from_csv


def test_csv_upload_with_all_required_parameters(engine):
    with open('mathesar/tests/imports/libraries.csv', 'rb') as csv_file:
        table = create_table_from_csv(
            name='Fairfax County',
            schema='Libraries',
            database_key='mathesar_db_test_database',
            csv_file=csv_file
        )
        assert table is not None
        assert table.name == 'Fairfax County'
        assert table.schema.name == 'Libraries'
        assert table.schema.database == 'mathesar_db_test_database'
        assert table.sa_num_records == 25


def test_csv_upload_with_parameters_positional(engine):
    with open('mathesar/tests/imports/libraries.csv', 'rb') as csv_file:
        table = create_table_from_csv(
            'Fairfax County 2',
            'Libraries',
            'mathesar_db_test_database',
            csv_file
        )
        assert table is not None
        assert table.name == 'Fairfax County 2'
        assert table.schema.name == 'Libraries'
        assert table.schema.database == 'mathesar_db_test_database'
        assert table.sa_num_records == 25


def test_csv_upload_with_duplicate_table_name(engine):
    with open('mathesar/tests/imports/libraries.csv', 'rb') as csv_file:
        table = create_table_from_csv(
            'Fairfax County 3',
            'Libraries',
            'mathesar_db_test_database',
            csv_file
        )
        assert table is not None
        assert table.name == 'Fairfax County 3'
        assert table.schema.name == 'Libraries'
        assert table.schema.database == 'mathesar_db_test_database'
        assert table.sa_num_records == 25
    with open('mathesar/tests/imports/libraries.csv', 'rb') as csv_file:
        with pytest.raises(ProgrammingError) as excinfo:
            create_table_from_csv(
                'Fairfax County 3',
                'Libraries',
                'mathesar_db_test_database',
                csv_file
            )
            assert 'psycopg2.errors.DuplicateTable' in str(excinfo.value)


def test_csv_upload_with_wrong_parameter(engine):
    with pytest.raises(TypeError) as excinfo:
        with open('mathesar/tests/imports/libraries.csv', 'rb') as csv_file:
            create_table_from_csv(
                name='Fairfax County',
                schema_name='Libraries',
                database_key='mathesar_db_test_database',
                csv_file=csv_file
            )
            assert 'unexpected keyword' in str(excinfo.value)


def test_csv_upload_with_missing_database_key(engine):
    with pytest.raises(TypeError) as excinfo:
        with open('mathesar/tests/imports/libraries.csv', 'rb') as csv_file:
            create_table_from_csv('Fairfax County', 'Libraries', csv_file)
            assert 'csv_file' in str(excinfo.value)
