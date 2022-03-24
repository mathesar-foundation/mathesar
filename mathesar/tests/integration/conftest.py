import pytest
from rest_framework.test import APIClient
from sqlalchemy import text, Table as SATable
from sqlalchemy import Column, MetaData, Integer, VARCHAR, CHAR, TEXT
from django.core.cache import cache
from playwright.sync_api import Page

from db.schemas.operations.create import create_schema as create_sa_schema
from db.schemas.utils import get_schema_name_from_oid, get_schema_oid_from_name
from db.tables.operations.select import get_oid_from_table
from mathesar.models import Database, Schema, Table
from mathesar.database.base import create_mathesar_engine
from mathesar.tests.integration.utils.locators import get_table_entry
from mathesar.utils.tables import create_empty_table

TEST_SCHEMA = 'import_csv_schema'
PATENT_SCHEMA = 'Patents'
NASA_TABLE = 'NASA Schema List'
ALL_DATA_TYPES_TABLE = 'All datatypes table'


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
def page(page):
    page.set_default_navigation_timeout(30000)
    yeild page


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


# Todo: Add all types here
@pytest.fixture
def table_with_all_types(schema):
    engine = create_mathesar_engine(schema.database.name)
    db_table = SATable(
        ALL_DATA_TYPES_TABLE, MetaData(bind=engine),
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('char', CHAR(100)),
        Column('varchar', VARCHAR()),
        Column('varchar_n', VARCHAR(100)),
        Column('text', TEXT()),
        schema=schema.name,
    )
    db_table.create()
    with engine.begin() as conn:
        conn.execute(db_table.insert().values(
            id=1,
            char='cell with char value',
            varchar='cell with varchar value',
            varchar_n='cell with varchar n value',
            text='cell with text value'
        ))

    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = Table.current_objects.create(oid=db_table_oid, schema=schema)

    yield table

    table.delete_sa_table()
    table.delete()


@pytest.fixture
def base_schema_url(schema, live_server):
    return f"{live_server}/{schema.database.name}/{schema.id}"


@pytest.fixture
def schemas_page_url(live_server, test_db_name):
    return f"{live_server}/{test_db_name}/schemas/"


@pytest.fixture
def go_to_all_types_table(page, table_with_all_types, base_schema_url):
    page.goto(base_schema_url)
    get_table_entry(page, table_with_all_types.name).click()


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


@pytest.fixture
def go_to_table_with_numbers_in_text(page, patent_schema, create_column, schema, base_schema_url):
    """
    Returns a table containing columns with numbers in TEXT format.
    """
    table_name = "Table 0"
    table = create_empty_table(table_name, schema)
    col_name = "foo"
    create_column(table, {"name": col_name, "type": "TEXT"})
    table.create_record_or_records([{col_name: "123"}, {col_name: "876"}])
    table.save()
    page.goto(base_schema_url)
    get_table_entry(page, table_name).click()
    yield table_name
