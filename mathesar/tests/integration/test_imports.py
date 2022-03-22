from playwright.sync_api import expect

from mathesar.tests.integration.utils.locators import get_table_entry, get_tables_list


def test_import_from_clipboard(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Import Data')")
    page.click("text=Copy and Paste Text")
    page.fill("textarea", "foo,bar\n2,3")
    page.click("button:has-text('Continue')")
    page.click("button:has-text('Finish Import')")
    expect(get_table_entry(page, "Table 0")).to_be_visible()


def test_import_from_file(page, base_schema_url):
    # default timeout (5000ms) is too short for this function
    page.set_default_timeout(10000)page.goto(base_schema_url)
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Import Data')")
    page.set_input_files(".file-upload input", "/code/mathesar/tests/data/patents.csv")
    page.click("button:has-text('Finish Import')")
    page.pause()
    # "1393 records" is part of the text shown below the table near the pager
    expect(page.locator("text=1393 records")).to_be_visible()
