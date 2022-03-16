from playwright.sync_api import Locator, Page


def create_new_empty_table(page: Page):
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")


def close_tab(tab_locator: Locator):
    tab_locator.hover()
    tab_locator.locator("[aria-label=remove]").click()
