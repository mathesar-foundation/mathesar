from playwright.sync_api import expect

from mathesar.tests.integration.utils.locators import get_tab, get_table_entry, get_tables_list
from mathesar.tests.integration.utils.table_actions import create_empty_table, delete_active_table, rename_table
from mathesar.tests.integration.utils.validators import expect_welcome_to_be_visible

welcome_text = "Welcome to Mathesar!"


def test_create_empty_table(page, custom_types_schema_url):
    page.goto(custom_types_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    # Table 0
    create_empty_table(page)
    expect(get_table_entry(page, "Table 0")).to_be_visible()


def test_delete_empty_table(page, custom_types_schema_url):
    page.goto(custom_types_schema_url)

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


def test_rename_empty_table(page, custom_types_schema_url):
    page.goto(custom_types_schema_url)

    # Create Table 0
    create_empty_table(page)
    table_0_entry = get_table_entry(page, "Table 0")
    table_0_tab = get_tab(page, "Table 0")

    rename_table(page, "Table 1")

    # Table 1 in the sidebar and in the tab title
    expect(get_table_entry(page, "Table 1")).to_be_visible()
    expect(get_tab(page, "Table 1")).to_be_visible()

    # Table 0 not visible
    expect(table_0_entry).not_to_be_visible()
    expect(table_0_tab).not_to_be_visible()


def test_rename_table_of_another_table(page, custom_types_schema_url):
    page.goto(custom_types_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    expect(get_table_entry(page, "Table 0")).to_be_visible()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    expect(get_table_entry(page, "Table 1")).to_be_visible()
    page.click("[aria-label='Table']")
    page.click("text=Rename")
    page.press("[aria-label='name']", "ArrowRight")
    page.fill("[aria-label='name']", "Table 0")
    expect(page.locator("text=A table with that name already exists.")).to_be_visible()
    expect(page.locator("button:has-text('Save')")).to_be_disabled()
