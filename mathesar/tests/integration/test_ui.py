from playwright.sync_api import Page, expect


def test_open_tab(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()


def test_close_tab(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()
