from playwright.sync_api import expect

from mathesar.tests.integration.utils.locators import get_table_entry, get_tables_list
from mathesar.tests.integration.utils.table_actions import create_empty_table, delete_active_table, add_column, insert_data_cell
from mathesar.tests.integration.utils.validators import expect_welcome_to_be_visible

welcome_text = "Welcome to Mathesar!"


def test_create_empty_table(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    create_empty_table(page)
    expect(get_table_entry(page, "Table 0")).to_be_visible()


def test_delete_empty_table(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    create_empty_table(page)
    expect(get_table_entry(page, "Table 0")).to_be_visible()
    delete_active_table(page)
    expect(get_tables_list(page)).to_be_empty()
    expect_welcome_to_be_visible(page, welcome_text)


def test_delete_three_tables(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()

    for x in range(2):
        create_empty_table(page)
        expect(get_table_entry(page, f"Table {x}")).to_be_visible()
        add_column(page, f"COLUMN-{x}")
        insert_data_cell(page, f"DATA-{x}")

    get_table_entry(page, "Table 0").click()
    for x in range(2):
        expect(page.locator(f"text=COLUMN-{x}")).to_be_visible()
        expect(page.locator(f"text=DATA-{x}")).to_be_visible()
        delete_active_table(page)

    expect(get_tables_list(page)).to_be_empty()
    expect_welcome_to_be_visible(page, welcome_text)
