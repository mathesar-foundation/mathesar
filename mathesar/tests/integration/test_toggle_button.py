from playwright.sync_api import expect
from mathesar.tests.integration.utils.locators import get_table_entry


def test_toggle_button(page):
    page.goto("http://0.0.0.0:8000/mathesar_tables/1/")
    page.goto("http://0.0.0.0:8000/mathesar_tables/1/?t=W1tdLG51bGxd")
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Import Data')")
    page.click("text=Copy and Paste Text")
    page.fill("textarea", "foo\ntrue\nfalse\nfalse\ntrue")
    page.click("button:has-text('Continue')")
    page.click("button:has-text('Finish Import')")
    expect(get_table_entry(page, "Table 0")).to_be_visible()
    page.click("button:has-text('New Record')")
    page.click("button:has-text('Refresh')")
    cell1 = page.locator("div:nth-child(5) div:nth-child(3) .cell-wrapper input[type=checkbox]")
    cell1.check()
    assert page.is_checked("div:nth-child(5) div:nth-child(3) .cell-wrapper input[type=checkbox]") is True
    cell1.uncheck()
    assert page.is_checked("div:nth-child(5) div:nth-child(3) .cell-wrapper input[type=checkbox]") is False
    cell1.check()
    assert page.is_checked("div:nth-child(5) div:nth-child(3) .cell-wrapper input[type=checkbox]") is True
