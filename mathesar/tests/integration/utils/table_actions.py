from mathesar.tests.integration.utils.validators import expect_modal_not_to_be_visible, expect_modal_to_be_visible
from playwright.sync_api import Locator, Page


def create_empty_table(page):
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")


def delete_active_table(page):
    page.click("[aria-label='Table']")
    page.click("div.menu div.menu-item:visible :text('Delete')")
    expect_modal_to_be_visible(page, "Delete Table?")
    # modal confirmation; blue button
    page.click("button:has-text('Delete Table')")
    expect_modal_not_to_be_visible(page)


def close_tab(tab_locator: Locator):
    tab_locator.hover()
    tab_locator.locator("[aria-label=remove]").click()
