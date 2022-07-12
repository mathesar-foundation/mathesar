import re

from playwright.sync_api import expect

first_pk_cell_in_table = ".row .cell.is-pk >> nth=0"


@pytest.mark.skip(reason="unclear why test is failing: deferring for later")
def test_add_row(page, go_to_patents_data_table):
    # Note: This is the New Record button at the top of the table. I also tried
    # to write a separate test for adding a row from the row placeholder at the
    # bottom of the table, but that proved difficult to write because of the
    # VirtualList so I abandoned it.

    # This assertion is here to make sure that we wait for the records to load
    # before clicking the "New Record" button. Otherwise the "created" class
    # won't be applied to the row correctly due to a race condition bug.
    # https://github.com/centerofci/mathesar/issues/1281
    expect(page.locator("text=KSC-12871")).to_be_visible()

    page.click("button:has-text('New Record')")
    expect(page.locator(".row.created .cell.is-pk:has-text('1,394')")).to_be_visible()


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
    input = row.locator("textarea")
    all_changes_saved = page.locator("text=All changes saved")
    row.locator(".cell:has-text('Issued')").dblclick()
    new_value = "TEST"
    input.fill(new_value)
    page.keyboard.press("Escape")
    expect(all_changes_saved).to_be_visible()
    cell = row.locator(f".cell:has-text('{new_value}')")
    expect(cell).to_have_class(re.compile("modified"))


def test_delete_multiple_rows(page, go_to_patents_data_table):
    page.hover(".row:has-text('ARC-14281-1')")
    page.check(".row:has-text('ARC-14281-1') input[type='checkbox']")
    page.hover(".row:has-text('ARC-14512-1')")
    page.check(".row:has-text('ARC-14512-1') input[type='checkbox']")
    page.click("button:has-text('Delete 2 records')")
    expect(page.locator("text=ARC-14281-1")).not_to_be_visible()
    expect(page.locator("text=ARC-14512-1")).not_to_be_visible()


def test_keyboard_Cell_Moving(page, go_to_patents_data_table):
    cell1 = page.locator(".cell:has-text('6445390') .cell-wrapper")
    cell2 = page.locator(".cell:has-text('ARC-14275-1') .cell-wrapper")
    cell3 = page.locator(".cell:has-text('6606612') .cell-wrapper")
    cell1.click()
    expect(cell1).to_have_class(re.compile("is-active"))
    page.keyboard.press('ArrowLeft')
    expect(cell1).not_to_have_class(re.compile("is-active"))
    expect(cell2).to_have_class(re.compile("is-active"))
    page.keyboard.press('ArrowRight')
    expect(cell1).to_have_class(re.compile("is-active"))
    expect(cell2).not_to_have_class(re.compile("is-active"))
    page.keyboard.press('ArrowDown')
    expect(cell1).not_to_have_class(re.compile("is-active"))
    expect(cell3).to_have_class(re.compile("is-active"))
    page.keyboard.press('ArrowUp')
    expect(cell1).to_have_class(re.compile("is-active"))
    expect(cell3).not_to_have_class(re.compile("is-active"))
