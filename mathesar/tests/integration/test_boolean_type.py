import re
import pytest
from playwright.sync_api import expect
from mathesar.tests.integration.utils.table_actions import open_column_options_and_verify_type, get_cell_selector
from mathesar.tests.integration.utils.component_actions import change_select_input_value
from mathesar.tests.integration.utils.validators import expect_tab_to_be_visible
from mathesar.database.types import UIType
from db.types.base import PostgresType


display_tab_selector = ".type-option-tab:has-text('Display')"
display_as_option_selector = "span:has-text('Display as') button"
use_custom_label_option_selector = "span:has-text('Use Custom Labels') input[type='checkbox']"
true_custom_label_option_selector = "span:has-text('Label for TRUE') input[type='text']"
false_custom_label_option_selector = "span:has-text('Label for FALSE') input[type='text']"


def expect_table_to_open(page):
    expect_tab_to_be_visible(page, "All datatypes table")


def test_boolean_options(page, go_to_all_types_table):
    expect_table_to_open(page)
    open_column_options_and_verify_type(page, "boolean_cb", UIType.BOOLEAN.display_name, PostgresType.BOOLEAN.id)
    open_column_options_and_verify_type(page, "boolean_dd", UIType.BOOLEAN.display_name, PostgresType.BOOLEAN.id)


def test_boolean_display_options(page, go_to_all_types_table):
    expect_table_to_open(page)
    open_column_options_and_verify_type(page, "boolean_cb", UIType.BOOLEAN.display_name, PostgresType.BOOLEAN.id)
    page.locator(display_tab_selector).click()
    display_as_option_locator = page.locator(display_as_option_selector)
    custom_label_option_locator = page.locator(use_custom_label_option_selector)
    expect(display_as_option_locator).to_be_visible()
    expect(display_as_option_locator).to_contain_text("Checkbox", use_inner_text=True)
    expect(custom_label_option_locator).not_to_be_visible()
    open_column_options_and_verify_type(page, "boolean_dd", UIType.BOOLEAN.display_name, PostgresType.BOOLEAN.id)
    page.locator(display_tab_selector).click()
    display_as_option_locator = page.locator(display_as_option_selector)
    expect(display_as_option_locator).to_be_visible()
    expect(display_as_option_locator).to_contain_text("Dropdown", use_inner_text=True)
    expect(custom_label_option_locator).to_be_visible()
    assert page.is_checked(use_custom_label_option_selector) is False


def test_boolean_disp_checkbox_to_dropdown(page, table_with_all_types, go_to_all_types_table):
    expect_table_to_open(page)
    open_column_options_and_verify_type(page, "boolean_cb", UIType.BOOLEAN.display_name, PostgresType.BOOLEAN.id)
    page.locator(display_tab_selector).click()
    display_as_option_locator = page.locator(display_as_option_selector)
    custom_label_option_locator = page.locator(use_custom_label_option_selector)
    expect(display_as_option_locator).to_be_visible()
    expect(display_as_option_locator).to_contain_text("Checkbox", use_inner_text=True)
    expect(custom_label_option_locator).not_to_be_visible()
    change_select_input_value(page, display_as_option_locator, "Dropdown")
    expect(custom_label_option_locator).to_be_visible()
    assert page.is_checked(use_custom_label_option_selector) is False
    page.check(use_custom_label_option_selector)
    true_custom_label_option_locator = page.locator(true_custom_label_option_selector)
    false_custom_label_option_locator = page.locator(false_custom_label_option_selector)
    expect(true_custom_label_option_locator).to_be_visible()
    expect(true_custom_label_option_locator).to_have_value("true")
    expect(false_custom_label_option_locator).to_be_visible()
    expect(false_custom_label_option_locator).to_have_value("false")
    page.fill(false_custom_label_option_selector, "")
    expect(page.locator(".type-options-content")).to_contain_text("This is a required field", use_inner_text=True)
    expect(false_custom_label_option_locator).to_have_class(re.compile("has-error"))
    page.fill(true_custom_label_option_selector, "Truthy Value")
    page.fill(false_custom_label_option_selector, "Falsy Value")
    page.click("button:has-text('Save')")
    expect(page.locator(".dropdown.column-opts-content")).not_to_be_visible()
    second_row_cell_selector = get_cell_selector(page, table_with_all_types, 2, "boolean_cb")
    expect(page.locator(second_row_cell_selector)).to_contain_text("Truthy Value", use_inner_text=True)
    third_row_cell_selector = get_cell_selector(page, table_with_all_types, 3, "boolean_cb")
    expect(page.locator(third_row_cell_selector)).to_contain_text("Falsy Value", use_inner_text=True)


@pytest.mark.skip(reason="unclear why test is failing: deferring for later")
def test_boolean_disp_dropdown_to_checkbox(page, table_with_all_types, go_to_all_types_table):
    expect_table_to_open(page)
    open_column_options_and_verify_type(page, "boolean_dd", UIType.BOOLEAN.display_name, PostgresType.BOOLEAN.id)
    page.locator(display_tab_selector).click()
    display_as_option_locator = page.locator(display_as_option_selector)
    custom_label_option_locator = page.locator(use_custom_label_option_selector)
    expect(display_as_option_locator).to_be_visible()
    expect(display_as_option_locator).to_contain_text("Dropdown", use_inner_text=True)
    expect(custom_label_option_locator).to_be_visible()
    change_select_input_value(page, display_as_option_locator, "Checkbox")
    expect(custom_label_option_locator).not_to_be_visible()
    page.click("button:has-text('Save')")
    expect(page.locator(".dropdown.column-opts-content")).not_to_be_visible()
    second_row_cell_selector = get_cell_selector(page, table_with_all_types, 2, "boolean_dd")
    second_row_checkbox_selector = f"{second_row_cell_selector} [type=checkbox]"
    assert page.is_checked(second_row_checkbox_selector) is True
    third_row_cell_selector = get_cell_selector(page, table_with_all_types, 3, "boolean_dd")
    third_row_checkbox_selector = f"{third_row_cell_selector} [type=checkbox]"
    assert page.is_checked(third_row_checkbox_selector) is False


def test_boolean_cell_checkbox_input(page, table_with_all_types, go_to_all_types_table):
    expect_table_to_open(page)
    first_row_cell_selector = get_cell_selector(page, table_with_all_types, 1, "boolean_cb")
    first_row_checkbox_selector = f"{first_row_cell_selector} [type=checkbox]"
    assert page.locator(first_row_checkbox_selector).element_handle().evaluate("node => node.indeterminate") is True
    page.check(first_row_checkbox_selector)
    assert page.locator(first_row_checkbox_selector).element_handle().evaluate("node => node.indeterminate") is False
    assert page.is_checked(first_row_checkbox_selector) is True
    page.uncheck(first_row_checkbox_selector)
    assert page.is_checked(first_row_checkbox_selector) is False
    page.check(first_row_checkbox_selector)
    assert page.is_checked(first_row_checkbox_selector) is True
    second_row_cell_selector = get_cell_selector(page, table_with_all_types, 2, "boolean_cb")
    second_row_checkbox_selector = f"{second_row_cell_selector} [type=checkbox]"
    assert page.is_checked(second_row_checkbox_selector) is True
    third_row_cell_selector = get_cell_selector(page, table_with_all_types, 3, "boolean_cb")
    third_row_checkbox_selector = f"{third_row_cell_selector} [type=checkbox]"
    assert page.is_checked(third_row_checkbox_selector) is False


def test_boolean_cell_checkbox_click_behavior(page, table_with_all_types, go_to_all_types_table):
    expect_table_to_open(page)
    cell_selector = get_cell_selector(page, table_with_all_types, 1, "boolean_cb")
    checkbox_selector = f"{cell_selector} [type=checkbox]"
    expect(page.locator(cell_selector)).not_to_have_class(re.compile("is-active"))
    assert page.locator(checkbox_selector).element_handle().evaluate("node => node.indeterminate") is True
    page.click(cell_selector)
    expect(page.locator(cell_selector)).to_have_class(re.compile("is-active"))
    assert page.locator(checkbox_selector).element_handle().evaluate("node => node.indeterminate") is True
    page.click(cell_selector)
    assert page.is_checked(checkbox_selector) is True
    page.click(cell_selector)
    assert page.is_checked(checkbox_selector) is False


def test_boolean_cell_checkbox_key_behavior(page, table_with_all_types, go_to_all_types_table):
    expect_table_to_open(page)
    cell_selector = get_cell_selector(page, table_with_all_types, 1, "boolean_cb")
    checkbox_selector = f"{cell_selector} [type=checkbox]"
    page.click(cell_selector)
    expect(page.locator(cell_selector)).to_have_class(re.compile("is-active"))
    assert page.locator(checkbox_selector).element_handle().evaluate("node => node.indeterminate") is True
    page.keyboard.press("Enter")
    assert page.is_checked(checkbox_selector) is True
    page.keyboard.press("Enter")
    assert page.is_checked(checkbox_selector) is False


def test_boolean_cell_dropdown_input(page, table_with_all_types, go_to_all_types_table):
    expect_table_to_open(page)
    first_row_cell_selector = get_cell_selector(page, table_with_all_types, 1, "boolean_dd")
    first_row_cell_locator = page.locator(first_row_cell_selector)
    expect(first_row_cell_locator).to_contain_text("NULL", use_inner_text=True)
    expect(first_row_cell_locator).not_to_have_class(re.compile("is-active"))
    page.click(first_row_cell_selector)
    expect(first_row_cell_locator).to_have_class(re.compile("is-active"))
    dropdown_id = page.locator(f"{first_row_cell_selector} .cell-wrapper").get_attribute("aria-controls")
    dropdown_selector = f".dropdown.single-select-cell-dropdown:has(ul#{dropdown_id})"
    expect(page.locator(dropdown_selector)).not_to_be_visible()
    page.click(first_row_cell_selector)
    expect(page.locator(f"{first_row_cell_selector} .cell-wrapper")).to_be_focused()
    expect(page.locator(dropdown_selector)).to_be_visible()
    expect(page.locator(f"{dropdown_selector} li")).to_contain_text(["true", "false"])
    page.click(f"{dropdown_selector} li:has-text('true')")
    expect(page.locator(dropdown_selector)).not_to_be_visible()
    expect(first_row_cell_locator).to_contain_text("true", use_inner_text=True)
    expect(page.locator(f"{first_row_cell_selector} .cell-wrapper")).to_be_focused()
    page.click(first_row_cell_selector)
    expect(page.locator(dropdown_selector)).to_be_visible()
    page.click(f"{dropdown_selector} li:has-text('false')")
    expect(page.locator(dropdown_selector)).not_to_be_visible()
    expect(first_row_cell_locator).to_contain_text("false", use_inner_text=True)
    expect(page.locator(f"{first_row_cell_selector} .cell-wrapper")).to_be_focused()
    second_row_cell_selector = get_cell_selector(page, table_with_all_types, 2, "boolean_dd")
    expect(page.locator(second_row_cell_selector)).to_contain_text("true", use_inner_text=True)
    third_row_cell_selector = get_cell_selector(page, table_with_all_types, 3, "boolean_dd")
    expect(page.locator(third_row_cell_selector)).to_contain_text("false", use_inner_text=True)


def test_boolean_cell_dropdown_key_behavior(page, table_with_all_types, go_to_all_types_table):
    expect_table_to_open(page)
    cell_selector = get_cell_selector(page, table_with_all_types, 1, "boolean_dd")
    cell_locator = page.locator(cell_selector)
    page.click(cell_selector)
    expect(cell_locator).to_have_class(re.compile("is-active"))
    dropdown_id = page.locator(f"{cell_selector} .cell-wrapper").get_attribute("aria-controls")
    dropdown_selector = f".dropdown.single-select-cell-dropdown:has(ul#{dropdown_id})"
    expect(page.locator(dropdown_selector)).not_to_be_visible()
    expect(page.locator(f"{cell_selector} .cell-wrapper")).to_be_focused()
    page.keyboard.press("Enter")
    expect(page.locator(dropdown_selector)).to_be_visible()
    page.keyboard.press("ArrowDown")
    page.keyboard.press("Enter")
    expect(page.locator(dropdown_selector)).not_to_be_visible()
    expect(cell_locator).to_contain_text("true", use_inner_text=True)
    expect(page.locator(f"{cell_selector} .cell-wrapper")).to_be_focused()
