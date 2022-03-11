from mathesar.tests.integration.utils.validators import expect_modal_not_to_be_visible, expect_modal_to_be_visible


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


def add_column(page, column_name):
    page.click("button[aria-label='New Column']")
    page.fill(".new-column-dropdown input:visible", column_name)
    page.click("button:has-text('Add')")


def insert_data_cell(page, data):
    page.click("div.editable-cell >> nth=1")
    page.dblclick("div.editable-cell >> nth=1")
    page.fill("textarea.input-element:visible", data)
    page.keyboard.press("Tab")
