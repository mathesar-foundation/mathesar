def get_tables_list(page):
    return page.locator("#sidebar li[aria-level='1']:has(button:has-text('Tables')) ul")


def get_table_entry(page, table_name):
    return get_tables_list(page).locator(f"li:has-text('{table_name}')")


def get_tab(page, tab_text):
    return page.locator(
        f".tab-container [role=tablist] [role=presentation]:has-text('{tab_text}')"
    )
