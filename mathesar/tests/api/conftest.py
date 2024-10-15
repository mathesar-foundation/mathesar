from pathlib import Path

from django.core.files import File
import pytest
from sqlalchemy import Column, INTEGER, VARCHAR, MetaData, BOOLEAN, TIMESTAMP, text
from sqlalchemy import Table as SATable

from db.columns.operations.select import get_column_attnum_from_name
from db.tables.operations.select import get_oid_from_table
from mathesar.models.base import DataFile
from db.metadata import get_empty_metadata


@pytest.fixture
def create_data_file():
    def _create_data_file(file_path, file_name):
        with open(file_path, 'rb') as csv_file:
            data_file = DataFile.objects.create(
                file=File(csv_file), created_from='file',
                base_name=file_name, type='csv'
            )

        return data_file
    return _create_data_file


@pytest.fixture
def table_for_reflection(engine):
    schema_name = 'a_new_schema'
    table_name = 'a_new_table'
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA {schema_name};'))
    with engine.begin() as conn:
        conn.execute(
            text(
                f'CREATE TABLE {schema_name}.{table_name}'
                f' (id INTEGER, name VARCHAR);'
            )
        )
    yield schema_name, table_name, engine
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {schema_name} CASCADE;'))
