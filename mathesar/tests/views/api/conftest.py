import pytest
from rest_framework.test import APIClient
from sqlalchemy import Column, String, MetaData, text
from sqlalchemy import Table as SATable
from django.core.files import File

from db.types import base, install
from db.schemas import create_schema, get_schema_oid_from_name
from db.tables import get_oid_from_table
from mathesar.models import Schema, Table, DataFile

from mathesar.database.base import create_mathesar_engine
from mathesar.imports.csv import create_table_from_csv

TEST_SCHEMA = 'import_csv_schema'
PATENT_SCHEMA = 'Patents'
NASA_TABLE = 'NASA Schema List'


@pytest.fixture
def client():
    return APIClient()


def _create_schema(engine, schema_name, test_db_name):
    create_schema(schema_name, engine)
    schema_oid = get_schema_oid_from_name(schema_name, engine)
    return Schema.objects.create(oid=schema_oid, database=test_db_name)


@pytest.fixture
def create_table(engine, csv_filename, test_db_name):
    """
    Creates a table factory, making sure to track and clean up new schemas
    """
    function_schemas = {}
    with open(csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))

    def _create_table(table_name, schema='Patents'):
        if schema in function_schemas:
            schema_model = function_schemas[schema]
        else:
            schema_model = _create_schema(engine, schema, test_db_name)
            function_schemas[schema] = schema_model
        return create_table_from_csv(data_file, table_name, schema_model)

    yield _create_table

    for schema in function_schemas:
        with engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE;'))


@pytest.fixture
def patent_schema(test_db_name):
    engine = create_mathesar_engine(test_db_name)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA IF EXISTS "{PATENT_SCHEMA}" CASCADE;'))
    yield _create_schema(engine, PATENT_SCHEMA, test_db_name)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA "{PATENT_SCHEMA}" CASCADE;'))
        conn.execute(text(f'DROP SCHEMA {base.SCHEMA} CASCADE;'))


@pytest.fixture
def empty_nasa_table(patent_schema):
    engine = create_mathesar_engine(patent_schema.database)
    db_table = SATable(
        NASA_TABLE, MetaData(bind=engine), Column('nasa_col1', String), schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = Table.objects.create(oid=db_table_oid, schema=patent_schema)
    return table


@pytest.fixture
def table_for_reflection(test_db_name):
    engine = create_mathesar_engine(test_db_name)
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
