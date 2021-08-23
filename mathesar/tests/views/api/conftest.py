import pytest
from rest_framework.test import APIClient
from sqlalchemy import Column, String, MetaData, text
from sqlalchemy import Table as SATable
from django.core.files import File

from db.types import base, install
from db.schemas import (
    create_schema as create_sa_schema,
    get_schema_oid_from_name, get_schema_name_from_oid
)
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


@pytest.fixture
def create_schema(engine, test_db_model):
    """
    Creates a schema factory, making sure to track and clean up new instances
    """
    function_schemas = {}

    def _create_schema(schema_name):
        if schema_name in function_schemas:
            schema_oid = function_schemas[schema_name]
        else:
            create_sa_schema(schema_name, engine)
            schema_oid = get_schema_oid_from_name(schema_name, engine)
            function_schemas[schema_name] = schema_oid
        schema_model, _ = Schema.objects.get_or_create(oid=schema_oid, database=test_db_model)
        return schema_model
    yield _create_schema

    for oid in function_schemas.values():
        # Handle schemas being renamed during test
        schema = get_schema_name_from_oid(oid, engine)
        with engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE;'))


@pytest.fixture
def create_table(csv_filename, create_schema):
    with open(csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))

    def _create_table(table_name, schema='Patents'):
        schema_model = create_schema(schema)
        return create_table_from_csv(data_file, table_name, schema_model)
    return _create_table


@pytest.fixture
def create_data_types_table(data_types_csv_filename, create_schema):
    with open(data_types_csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))

    def _create_table(table_name, schema='Data Types'):
        schema_model = create_schema(schema)
        return create_table_from_csv(data_file, table_name, schema_model)
    return _create_table


@pytest.fixture
def patent_schema(test_db_model, create_schema):
    engine = create_mathesar_engine(test_db_model.name)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA IF EXISTS "{PATENT_SCHEMA}" CASCADE;'))
    yield create_schema(PATENT_SCHEMA)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {base.SCHEMA} CASCADE;'))


@pytest.fixture
def empty_nasa_table(patent_schema):
    engine = create_mathesar_engine(patent_schema.database.name)
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
