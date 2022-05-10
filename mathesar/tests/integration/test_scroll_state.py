from playwright.sync_api import expect
from mathesar.tests.integration.utils.locators import get_table_entry
from mathesar.tests.integration.utils.table_actions import create_empty_table, rename_column


def test_scroll_preserving_on_tabs_switching(page, go_to_patents_data_table):
    # initially, the 30th element is not in the view
    thirtieth_element = page.locator('span.number:text-is("30")')
    expect(thirtieth_element).not_to_be_visible()
    # scroll makes it visible
    page.locator(".ps__rail-y").click()
    expect(thirtieth_element).to_be_visible()
    # creating new table switches to its tab
    create_empty_table(page)
    get_table_entry(page, "patents").click()
    expect(thirtieth_element).to_be_visible()


def test_scroll_preserving_on_active_table_updating(page, go_to_patents_data_table):
    thirtieth_element = page.locator("span.number:text-is('30')")
    expect(thirtieth_element).not_to_be_visible()
    page.locator(".ps__rail-y").click()
    expect(thirtieth_element).to_be_visible()
    rename_column(page, "Center", "Updated Center")
    expect(thirtieth_element).to_be_visible()


# TODO: add 'Filter', 'Group'
def test_scroll_reset_on_sort(page, go_to_patents_data_table):
    thirtieth_element = page.locator("span.number:text-is('30')")
    expect(thirtieth_element).not_to_be_visible()
    page.locator(".ps__rail-y").click()
    expect(thirtieth_element).to_be_visible()
    page.locator("button:has-text('Sort')").click()
    page.locator("button:has-text('Add new Sort column')").click()
    page.locator("td.action >> button:first-child").click()
    expect(thirtieth_element).not_to_be_visible()


def test_scroll_resetting_on_table_page_update(page, go_to_patents_data_table):
    thirtieth_element = page.locator("span.number:text-is('30')")
    expect(thirtieth_element).not_to_be_visible()
    page.locator(".ps__rail-y").click()
    expect(thirtieth_element).to_be_visible()
    page.locator("[aria-label='Goto Page 2']").click()
    expect(page.locator("span.number:text-is('501')")).to_be_visible()


def test_scroll_resetting_on_table_page_size_update(page, go_to_patents_data_table):
    thirtieth_element = page.locator("span.number:text-is('30')")
    expect(thirtieth_element).not_to_be_visible()
    page.locator(".ps__rail-y").click()
    expect(thirtieth_element).to_be_visible()
    page.locator("button:has-text('500')").click()
    page.locator("li[role='option']:has-text('100')").click()
    expect(thirtieth_element).not_to_be_visible()
