from playwright.sync_api import Page


def get_tables_list(page: Page):
    return page.locator("#sidebar li[aria-level='1']:has(button:has-text('Tables')) ul")


def get_table_entry(page: Page, table_name):
    return get_tables_list(page).locator(f"li:has-text('{table_name}')")
