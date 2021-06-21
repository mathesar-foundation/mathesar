import pytest
from rest_framework.test import APIClient
from sqlalchemy import Column, String, MetaData, text
from sqlalchemy import Table as SATable

from db.schemas import create_schema, get_schema_oid_from_name
from db.tables import get_oid_from_table
from mathesar.models import Schema, Table

from mathesar.database.base import create_mathesar_engine
from mathesar.imports.csv import legacy_create_table_from_csv

PATENT_SCHEMA = 'Patents'
NASA_TABLE = 'NASA Schema List'


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def create_table(engine, csv_filename, test_db_name):
    def _create_table(table_name):
        with open(csv_filename, 'rb') as csv_file:
            table = legacy_create_table_from_csv(
                name=table_name,
                schema='Patents',
                database_key=test_db_name,
                csv_file=csv_file
            )
        return table

    return _create_table


@pytest.fixture
def patent_schema(test_db_name):
    engine = create_mathesar_engine(test_db_name)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA IF EXISTS "{PATENT_SCHEMA}" CASCADE;'))
    create_schema(PATENT_SCHEMA, engine)
    schema_oid = get_schema_oid_from_name(PATENT_SCHEMA, engine)
    yield Schema.objects.create(oid=schema_oid, database=test_db_name)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA "{PATENT_SCHEMA}" CASCADE;'))


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
