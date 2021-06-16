import pytest
from rest_framework.test import APIClient

from mathesar.imports.csv import legacy_create_table_from_csv


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def create_table(engine, csv_filename, test_db_name):
    def _create_table(table_name, schema='Patents'):
        with open(csv_filename, 'rb') as csv_file:
            table = legacy_create_table_from_csv(
                name=table_name,
                schema=schema,
                database_key=test_db_name,
                csv_file=csv_file
            )
        return table

    return _create_table
