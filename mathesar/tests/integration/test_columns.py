from playwright.sync_api import expect


def test_add_column(page, go_to_patents_data_table):
    page.click("button[aria-label='New Column']")
    column_name = "TEST"
    page.fill(".new-column-dropdown input", column_name)
    page.click("button:has-text('Add')")
    column_header = f".table-content .header .cell .name:has-text('{column_name}')"
    expect(page.locator(column_header)).to_be_visible()


def test_convert_text_column_to_number(page, go_to_patents_data_table):
    page.click(".table-content .header .cell:has-text('Center')")
    page.click(".dropdown button:has-text('Text')")
    page.click(".type-list button:has-text('Number')")
    page.click("button:has-text('Save')")
    error_message = "Unable to change column"
    toast_box = f".toast-presenter .toast-item .message:has-text('{error_message}')"
    expect(page.locator(toast_box)).to_be_visible()


def test_convert_text_col_of_num_to_num_col(page, go_to_table_with_numbers_in_text):
    page.click("button:has-text('T foo')")
    page.click("button:has-text('Text')")
    page.click("text=# Number")
    page.click("button:has-text('Save')")
    page.click("button:has-text('refresh')")
    page.click(".header .cell .btn:has-text('# foo')")
    page.click("button:has-text('Number')")
    selected_type = ".section .type-list li.selected"
    expect(page.locator(selected_type)).to_contain_text("Number")


def test_group_by_column(page, go_to_patents_data_table):
    # group by the column "Center"
    page.click(".table-content .header .cell:has-text('Center')")
    page.click(".dropdown button:has-text('Group by column')")
    # verify the count of the first listed group and its name
    expect(page.locator("text=count: 138")).to_be_visible()
    expect(page.locator("text=Center: undefined")).to_be_visible()
    expect(page.locator("button:has-text('Group (1)')")).to_be_visible()
    # ungroup
    page.click(".table-content .header .cell:has-text('Center')")
    page.click("button:has-text('Remove grouping')")
    # verify
    expect(page.locator("text=count: 138")).not_to_be_visible()
    expect(page.locator("text=Center: undefined")).not_to_be_visible()
    expect(page.locator("button:has-text('Group')")).to_be_visible()
