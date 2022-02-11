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


def test_delete_multiple_rows(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()
