import re

from playwright.sync_api import expect

first_pk_cell_in_table = ".row .cell.is-pk >> nth=0"


def test_add_row(page, go_to_patents_data_table):
    # Note: This is the New Record button at the top of the table. I also tried
    # to write a separate test for adding a row from the row placeholder at the
    # bottom of the table, but that proved difficult to write because of the
    # VirtualList so I abandoned it.
    page.click("button:has-text('New Record')")
    expect(page.locator(".row.done .cell.is-pk:has-text('1394')")).to_be_visible()


def test_sort_table_by_column(page, go_to_patents_data_table):
    page.click("button:has-text('Title')")
    page.click("button:has-text('Sort Descending')")
    page.click("button:has-text('Status')")
    page.click("button:has-text('Sort Ascending')")
    expect(page.locator(first_pk_cell_in_table)).to_have_text("729")


def test_increment_pagination(page, go_to_patents_data_table):
    page.click("[aria-label='Goto Page 2']")
    expect(page.locator(first_pk_cell_in_table)).to_have_text("501")


def test_edit_cell(page, go_to_patents_data_table):
    row = page.locator(".row:has-text('ARC-14231-3')")
    cell = row.locator(".cell:has-text('Issued')")
    input = cell.locator("input")
    all_changes_saved = page.locator("text=All changes saved")
    cell.dblclick()
    input.fill("TEST")
    page.keyboard.press("Enter")
    expect(all_changes_saved).to_be_visible()
    expect(row).to_have_class(re.compile("updated"))


def test_delete_multiple_rows(page, go_to_patents_data_table):
    page.hover(".row:has-text('ARC-14281-1')")
    page.check(".row:has-text('ARC-14281-1') input[type='checkbox']")
    page.hover(".row:has-text('ARC-14512-1')")
    page.check(".row:has-text('ARC-14512-1') input[type='checkbox']")
    page.click("button:has-text('Delete 2 records')")
    expect(page.locator("text=ARC-14281-1")).not_to_be_visible()
    expect(page.locator("text=ARC-14512-1")).not_to_be_visible()
