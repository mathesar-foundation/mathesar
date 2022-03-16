from playwright.sync_api import expect

from mathesar.tests.integration.utils.locators import get_tab, get_table_entry, get_tables_list
from mathesar.tests.integration.utils.table_actions import create_empty_table, delete_active_table
from mathesar.tests.integration.utils.validators import expect_welcome_to_be_visible

welcome_text = "Welcome to Mathesar!"


def test_create_empty_table(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    # Table 0
    create_empty_table(page)
    expect(get_table_entry(page, "Table 0")).to_be_visible()


def test_delete_empty_table(page, base_schema_url):
    page.goto(base_schema_url)
    expect_welcome_to_be_visible(page, welcome_text)

    # No entry in sidebar
    expect(get_tables_list(page)).to_be_empty()

    # Create Table 0
    create_empty_table(page)
    expect(get_table_entry(page, "Table 0")).to_be_visible()

    # Delete Table 0
    delete_active_table(page)

    # No Table 0 entry in the sidebar and no tab
    expect(get_tables_list(page)).to_be_empty()
    expect(get_tab(page, "Table 0")).not_to_be_visible()
    
    expect_welcome_to_be_visible(page, welcome_text)
