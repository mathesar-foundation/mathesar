from playwright.sync_api import Page, expect


def get_tables_list(page: Page):
    return page.locator("#sidebar li[aria-level='1']:has(button:has-text('Tables')) ul")


def get_table_entry(tables_list, table_name):
    return tables_list.locator(f"li:has-text('{table_name}')")


def test_create_empty_table(page: Page, base_schema_url):
    page.goto(base_schema_url)
    tables_list = get_tables_list(page)
    expect(tables_list).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    table_entry = get_table_entry(tables_list, "Table 0")
    expect(table_entry).to_be_visible()


def test_import_from_clipboard(page: Page, base_schema_url):
    page.goto(base_schema_url)
    tables_list = get_tables_list(page)
    expect(tables_list).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Import Data')")
    page.click("text=Copy and Paste Text")
    page.fill("textarea", "foo,bar\n2,3")
    page.click("button:has-text('Continue')")
    page.click("button:has-text('Finish Import')")
    table_entry = get_table_entry(tables_list, "Table 0")
    expect(table_entry).to_be_visible()


def test_import_from_file(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Import Data')")
    page.set_input_files(".file-upload input", "/code/mathesar/tests/data/patents.csv")
    page.click("button:has-text('Finish Import')")
    # "1393 records" is part of the text shown below the table near the pager
    expect(page.locator("text=1393 records")).to_be_visible()
