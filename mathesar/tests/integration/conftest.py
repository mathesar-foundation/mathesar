import pytest
from rest_framework.test import APIClient
from django.core.cache import cache

from db.types.base import PostgresType
from mathesar.tests.integration.utils.locators import get_table_entry
from mathesar.utils.tables import create_empty_table


TIMEOUT_HACK = {
    "timeout": 30000,
}
"""
See https://github.com/centerofci/mathesar/issues/1285
"""


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def page(page):
    page.set_default_navigation_timeout(30000)
    page.set_default_timeout(30000)
    yield page


@pytest.fixture
def schema_name():
    return 'integration_tests_schema'


@pytest.fixture
def schema(create_schema, schema_name):
    return create_schema(schema_name)


# Todo: Add all types here
@pytest.fixture
def table_with_all_types(schema, create_column_with_display_options):
    ALL_DATA_TYPES_TABLE = 'All datatypes table'
    table = create_empty_table(ALL_DATA_TYPES_TABLE, schema)
    create_column_with_display_options(table, {"name": "char", "type": PostgresType.CHARACTER.id, "type_options": {"length": 100}})
    create_column_with_display_options(table, {"name": "varchar", "type": PostgresType.CHARACTER_VARYING.id})
    create_column_with_display_options(table, {"name": "varchar_n", "type": PostgresType.CHARACTER_VARYING.id, "type_options": {"length": 100}})
    create_column_with_display_options(table, {"name": "text", "type": PostgresType.TEXT.id})
    create_column_with_display_options(table, {"name": "boolean_cb", "type": PostgresType.BOOLEAN.id})
    create_column_with_display_options(table, {"name": "boolean_dd", "type": PostgresType.BOOLEAN.id, "display_options": {"input": "dropdown"}})
    table.create_record_or_records([
        {
            "char": "cell with char value",
            "varchar": "cell with varchar value",
            "varchar_n": "cell with varchar n value",
            "text": "cell with text value",
            "boolean_cb": None,
            "boolean_dd": None
        },
        {
            "char": "Row: 2, Column: char",
            "varchar": "Row: 2: Column: varchar",
            "varchar_n": "Row 2: Column: varchar_n",
            "text": "Row 2: Column: text",
            "boolean_cb": True,
            "boolean_dd": True
        },
        {
            "char": "Row: 3, Column: char",
            "varchar": "Row: 3: Column: varchar",
            "varchar_n": "Row 3: Column: varchar_n",
            "text": "Row 3: Column: text",
            "boolean_cb": False,
            "boolean_dd": False
        }
    ])
    table.save()
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
def go_to_patents_data_table(page, create_patents_table, schema_name, base_schema_url):
    """
    Imports the `patents.csv` data into a table named "patents" and navigates to
    the view of that table before starting the test.
    """
    table_name = "patents"
    table = create_patents_table(table_name, schema_name)
    table.import_verified = True
    table.save()
    page.goto(base_schema_url)
    get_table_entry(page, table_name).click()
    yield table_name


@pytest.fixture
def go_to_table_with_numbers_in_text(page, create_column, schema, base_schema_url):
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
