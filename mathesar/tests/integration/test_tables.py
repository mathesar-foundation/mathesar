from playwright.sync_api import expect

from mathesar.tests.integration.utils.locators import get_table_entry, get_tables_list


def test_create_empty_table(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    expect(get_table_entry(page, "Table 0")).to_be_visible()


def test_rename_table_of_another_table(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    expect(get_table_entry(page, "Table 0")).to_be_visible()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    expect(get_table_entry(page, "Table 1")).to_be_visible()
    page.click("[aria-label='Table Actions']")
    page.click("text=Rename")
    page.press("[aria-label='name']", "ArrowRight")
    page.fill("[aria-label='name']", "Table 0")
    expect(page.locator("text=A table with that name already exists.")).to_be_visible()
    expect(page.locator("button:has-text('Save')")).to_be_disabled()
