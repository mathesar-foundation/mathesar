from playwright.sync_api import Page, expect


def test_add_row(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()


def test_sort_table_by_column(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()


def test_increment_pagination(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()


def test_edit_cell(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()


def test_delete_multiple_rows(page: Page, go_to_patents_data_table):
    page.hover(".row:has-text('ARC-14281-1')")
    page.check(".row:has-text('ARC-14281-1') input[type='checkbox']")
    page.hover(".row:has-text('ARC-14512-1')")
    page.check(".row:has-text('ARC-14512-1') input[type='checkbox']")
    page.click("button:has-text('Delete 2 records')")
    expect(page.locator("text=ARC-14281-1")).not_to_be_visible()
    expect(page.locator("text=ARC-14512-1")).not_to_be_visible()
