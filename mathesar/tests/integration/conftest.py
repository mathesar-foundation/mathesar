import pytest
from rest_framework.test import APIClient
from sqlalchemy import text
from django.core.cache import cache

from db.schemas.operations.create import create_schema as create_sa_schema
from db.schemas.utils import get_schema_name_from_oid, get_schema_oid_from_name
from mathesar.models import Database, Schema
from mathesar.tests.integration.utils.locators import get_table_entry

TEST_SCHEMA = 'import_csv_schema'
PATENT_SCHEMA = 'Patents'
NASA_TABLE = 'NASA Schema List'


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def test_db_model(test_db_name):
    database_model = Database.current_objects.create(name=test_db_name)
    return database_model


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
        schema_model, _ = Schema.current_objects.get_or_create(oid=schema_oid, database=test_db_model)
        return schema_model

    yield _create_schema

    for oid in function_schemas.values():
        # Handle schemas being renamed during test
        schema = get_schema_name_from_oid(oid, engine)
        with engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE;'))


@pytest.fixture
def schema_name():
    return 'table_tests'


@pytest.fixture
def schema(create_schema, schema_name):
    return create_schema(schema_name)


@pytest.fixture
def base_schema_url(patent_schema, live_server):
    return f"{live_server}/{patent_schema.database.name}/{patent_schema.id}"


@pytest.fixture
def schemas_page_url(live_server, test_db_name):
    return f"{live_server}/{test_db_name}/schemas/"


@pytest.fixture
def go_to_patents_data_table(page, create_table, schema_name, base_schema_url):
    """
    Imports the `patents.csv` data into a table named "patents" and navigates to
    the view of that table before starting the test.
    """
    table_name = "patents"
    table = create_table(table_name, schema_name)
    table.import_verified = True
    table.save()
    page.goto(base_schema_url)
    get_table_entry(page, table_name).click()
    yield table_name
