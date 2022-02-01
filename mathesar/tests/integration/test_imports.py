from playwright.sync_api import Page, expect


def test_create_empty_table(page: Page, live_server):
    page.goto(f"{live_server}")
    tables_list = page.locator("#sidebar li[aria-level='1']:has(button:has-text('Tables')) ul")
    expect(tables_list).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    table_name = "Table 0"
    table_entry = tables_list.locator(f"li:has-text('{table_name}')")
    expect(table_entry).to_be_visible()

def test_import_from_clipboard(page: Page, live_server):
    page.goto(f"{live_server}")
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Import Data')")
    page.pause()
