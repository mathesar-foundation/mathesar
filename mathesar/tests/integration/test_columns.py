import pytest
from playwright.sync_api import expect
from mathesar.tests.integration.utils.table_actions import open_column_options, get_default_value_checkbox
from mathesar.tests.integration.utils.validators import expect_tab_to_be_visible


# def test_add_column(page, go_to_patents_data_table):
#     page.click("button[aria-label='New Column']")
#     column_name = "TEST"
#     page.fill(".new-column-dropdown input", column_name)
#     page.click("button:has-text('Add')")
#     column_header = f".table-content .header .cell .name:has-text('{column_name}')"
#     expect(page.locator(column_header)).to_be_visible()


def test_convert_text_column_to_number(page, go_to_patents_data_table):
    page.click(".table-content .header .cell:has-text('Center')")
    page.click(".dropdown button:has-text('Text')")
    page.click(".type-list button:has-text('Number')")
    page.click("button:has-text('Save')")
    error_message = "Unable to change column"
    toast_box = f".toast-presenter .toast-item .message:has-text('{error_message}')"
    expect(page.locator(toast_box)).to_be_visible()


@pytest.mark.skip(reason="unclear why test is failing: deferring for later")
def test_convert_text_col_of_num_to_num_col(page, go_to_table_with_numbers_in_text):
    page.click("button:has-text('foo')")
    page.click("button:has-text('Text')")
    page.click("text=Number")
    page.click("button:has-text('Save')")

    # I was encountering a tricky race condition here that led to this test
    # failing non-deterministically. Adding this `wait` statement fixed it. There
    # very well could be a better solution.
    page.wait_for_load_state('networkidle')

    page.click(".header .cell .btn:has(svg[aria-label='Number']):has-text('foo')")
    page.click("button:has-text('Number')")
    selected_type = ".section .type-list li.selected"
    expect(page.locator(selected_type)).to_contain_text("Number")


def test_group_by_column(page, go_to_patents_data_table):
    # selectors
    selector_column_header = ".table-content .header .cell:has-text('Center')"
    selector_group_header = "div.groupheader >> span >> nth=0"
    # locators
    locator_group_header = page.locator(selector_group_header)
    locator_group_count = page.locator("text=count: 138")
    # group by the column "Center"
    page.click(selector_column_header)
    page.click(".dropdown button:has-text('Group by column')")
    # verify the count of the first listed group and its member
    expect(locator_group_count).to_be_visible()
    expect(locator_group_header).to_contain_text(': NASA Ames Research Center')
    expect(page.locator("button:has-text('Group (1)')")).to_be_visible()
    # ungroup
    page.click(selector_column_header)
    page.click("button:has-text('Remove grouping')")
    # verify
    expect(locator_group_count).not_to_be_visible()
    expect(locator_group_header).not_to_be_visible()
    expect(page.locator("button:has-text('Group')")).to_be_visible()


def test_set_column_default_value(page, go_to_all_types_table):
    expect_tab_to_be_visible(page, "All datatypes table")
    open_column_options(page, "text", "Text")
    default_value_cb_locator = get_default_value_checkbox(page)
    default_value_cb_handle = default_value_cb_locator.element_handle()
    assert default_value_cb_handle.is_checked() is False
    default_value_cb_handle.click()
    assert default_value_cb_handle.is_checked() is True
    page.pause()
    default_value_input = page.locator("span:has-text('Default Value') textarea")
    expect(default_value_input).to_be_empty()
    default_value_input.fill("some default value")
    page.click("button:has-text('Save')")
    expect(page.locator(".type-options-content")).not_to_be_visible()
    page.click("button:has-text('New Record')")
    created_row = page.locator(".row.created")
    expect(created_row).to_be_visible()
    expect(created_row.locator(".cell:has-text('some default value')")).to_be_visible()
