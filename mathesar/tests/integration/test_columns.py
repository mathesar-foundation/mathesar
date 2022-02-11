from playwright.sync_api import Page, expect


def test_add_column(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()
