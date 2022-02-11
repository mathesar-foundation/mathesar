from playwright.sync_api import Page, expect


def test_add_multi_column_unique_constraint(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()


def test_remove_multi_column_unique_constraint(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()


def test_try_to_dissallow_null_for_column_with_null_values(page: Page, base_schema_url):
    page.goto(base_schema_url)
    page.pause()
    raise NotImplementedError()
