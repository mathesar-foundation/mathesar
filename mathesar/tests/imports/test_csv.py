import pytest

from sqlalchemy.exc import InvalidRequestError

from mathesar.imports.csv import legacy_create_table_from_csv


def test_csv_upload_with_all_required_parameters(engine, csv_filename, test_db_name):
    with open(csv_filename, 'rb') as csv_file:
        table = legacy_create_table_from_csv(
            name='NASA',
            schema='Patents',
            database_key=test_db_name,
            csv_file=csv_file
        )
        assert table is not None
        assert table.name == 'NASA'
        assert table.schema.name == 'Patents'
        assert table.schema.database == test_db_name
        assert table.sa_num_records() == 1393


def test_csv_upload_with_parameters_positional(engine, csv_filename, test_db_name):
    with open(csv_filename, 'rb') as csv_file:
        table = legacy_create_table_from_csv(
            'NASA 2',
            'Patents',
            test_db_name,
            csv_file
        )
        assert table is not None
        assert table.name == 'NASA 2'
        assert table.schema.name == 'Patents'
        assert table.schema.database == test_db_name
        assert table.sa_num_records() == 1393


def test_csv_upload_with_duplicate_table_name(engine, csv_filename, test_db_name):
    schema_name = 'Patents'
    table_name = 'NASA 3'
    already_defined_str = (
        f"Table '{schema_name}.{table_name}' is already defined"
    )

    with open(csv_filename, 'rb') as csv_file:
        table = legacy_create_table_from_csv(
            table_name,
            schema_name,
            test_db_name,
            csv_file
        )
        assert table is not None
        assert table.name == table_name
        assert table.schema.name == schema_name
        assert table.schema.database == test_db_name
        assert table.sa_num_records() == 1393
    with open(csv_filename, 'rb') as csv_file:
        with pytest.raises(InvalidRequestError) as excinfo:
            legacy_create_table_from_csv(
                table_name,
                schema_name,
                test_db_name,
                csv_file
            )
            assert already_defined_str in str(excinfo)


def test_csv_upload_with_wrong_parameter(engine, csv_filename, test_db_name):
    with pytest.raises(TypeError) as excinfo:
        with open(csv_filename, 'rb') as csv_file:
            legacy_create_table_from_csv(
                name='NASA',
                schema_name='Patents',
                database_key=test_db_name,
                csv_file=csv_file
            )
            assert 'unexpected keyword' in str(excinfo.value)


def test_csv_upload_with_missing_database_key(engine, csv_filename):
    with pytest.raises(TypeError) as excinfo:
        with open(csv_filename, 'rb') as csv_file:
            legacy_create_table_from_csv('NASA', 'Patents', csv_file)
            assert 'csv_file' in str(excinfo.value)
