from playwright.sync_api import expect

from mathesar.tests.integration.utils.locators import get_table_entry, get_tables_list


def test_toggle_button(page, base_schema_url):
    page.goto(base_schema_url)
    expect(get_tables_list(page)).to_be_empty()
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Import Data')")
    page.click("text=Copy and Paste Text")
    page.fill("textarea", "foo\ntrue\nfalse\nfalse\ntrue")
    page.click("button:has-text('Continue')")
    page.click("button:has-text('Finish Import')")
    expect(get_table_entry(page, "Table 0")).to_be_visible()
    page.click("button:has-text('New Record')")
    page.click("button:has-text('Refresh')")
    cell1 = page.goto(".s-sG5YPZwKUQz_ div :nth-child(5) input[type=checkbox]")
    page.check(cell1)
    assert page.is_checked(cell1) is True
    page.uncheck(cell1)
    assert page.is_checked(cell1) is False
    page.check(cell1)
    assert page.is_checked(cell1) is True
