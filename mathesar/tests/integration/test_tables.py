from playwright.sync_api import expect

from mathesar.tests.integration.utils.locators import get_table_entry, get_tables_list


def test_create_empty_table(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    expect(get_table_entry(page, "Table 0")).to_be_visible()
