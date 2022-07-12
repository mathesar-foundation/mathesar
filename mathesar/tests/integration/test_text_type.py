import re
from playwright.sync_api import expect
from mathesar.tests.integration.utils.table_actions import open_column_options_and_verify_type
from mathesar.tests.integration.utils.validators import expect_tab_to_be_visible
from mathesar.database.types import UIType
from db.types.base import PostgresType


restrict_field_size_option_locator = "span:has-text('Restrict Field Size') input[type='checkbox']"
field_size_limit_locator = "span:has-text('Field Size Limit') input[type='text']"


def expect_table_to_open(page):
    expect_tab_to_be_visible(page, "All datatypes table")


def verify_column_type(page, db_type):
    db_type_text = f"Database type {db_type}"
    expect(page.locator(".type-options-content")).to_contain_text(db_type_text, use_inner_text=True)


def open_and_verify_column_type(page, column_name, db_type):
    open_column_options_and_verify_type(page, column_name, UIType.TEXT.display_name, db_type)


@pytest.mark.skip(reason="unclear why test is failing: deferring for later")
def test_add_new_column_default_text_type(page, go_to_all_types_table):
    expect_table_to_open(page)
    page.click("button[aria-label='New Column']")
    column_name = "NewColumnText"
    page.fill(".new-column-dropdown input", column_name)
    page.click("button:has-text('Add')")
    open_and_verify_column_type(page, column_name, PostgresType.TEXT.id)


def test_text_options(page, go_to_all_types_table):
    expect_table_to_open(page)
    column_name = "text"
    open_and_verify_column_type(page, column_name, PostgresType.TEXT.id)
    expect(page.locator(restrict_field_size_option_locator)).not_to_be_checked()
    expect(page.locator(field_size_limit_locator)).not_to_be_visible()


def test_varchar_options(page, go_to_all_types_table):
    expect_table_to_open(page)
    column_name = "varchar"
    open_and_verify_column_type(page, column_name, PostgresType.CHARACTER_VARYING.id)
    expect(page.locator(restrict_field_size_option_locator)).to_be_checked()
    field_size_input = page.locator(field_size_limit_locator)
    expect(field_size_input).to_be_visible()
    expect(field_size_input).to_have_class(re.compile("has-error"))
    expect(field_size_input).to_be_empty()
    expect(page.locator(".type-options-content")).to_contain_text("This is a required field", use_inner_text=True)


def test_varchar_n_options(page, go_to_all_types_table):
    expect_table_to_open(page)
    column_name = "varchar_n"
    open_and_verify_column_type(page, column_name, PostgresType.CHARACTER_VARYING.id)
    expect(page.locator(restrict_field_size_option_locator)).to_be_checked()
    field_size_input = page.locator(field_size_limit_locator)
    expect(field_size_input).to_be_visible()
    expect(field_size_input).to_have_value("100")


def test_char_options(page, go_to_all_types_table):
    expect_table_to_open(page)
    column_name = "char"
    open_and_verify_column_type(page, column_name, PostgresType.CHARACTER.id)
    expect(page.locator(restrict_field_size_option_locator)).to_be_checked()
    field_size_input = page.locator(field_size_limit_locator)
    expect(field_size_input).to_be_visible()
    expect(field_size_input).to_have_value("100")


def test_text_cell(page, go_to_all_types_table):
    expect_table_to_open(page)
    row = page.locator(":nth-match(.row, 1)")
    cell = row.locator(".cell:has-text('text value') .cell-wrapper")
    cell.dblclick()
    expect(row.locator("textarea")).to_be_visible()


def test_varchar_cell(page, go_to_all_types_table):
    expect_table_to_open(page)
    row = page.locator(":nth-match(.row, 1)")
    cell = row.locator(".cell:has-text('varchar value') .cell-wrapper")
    cell.dblclick()
    expect(row.locator("textarea")).to_be_visible()
    n_cell = row.locator(".cell:has-text('varchar n value') .cell-wrapper")
    n_cell.dblclick()
    expect(row.locator("textarea")).to_be_visible()


def test_char_cell(page, go_to_all_types_table):
    expect_table_to_open(page)
    row = page.locator(":nth-match(.row, 1)")
    cell = row.locator(".cell:has-text('cell with char value') .cell-wrapper")
    cell.dblclick()
    expect(row.locator("input[type='text']")).to_be_visible()


def test_text_db_type_selection(page, go_to_all_types_table):
    expect_table_to_open(page)
    column_name = "text"
    open_and_verify_column_type(page, column_name, PostgresType.TEXT.id)
    expect(page.locator(restrict_field_size_option_locator)).not_to_be_checked()
    expect(page.locator(field_size_limit_locator)).not_to_be_visible()
    page.locator(restrict_field_size_option_locator).set_checked(True)
    expect(page.locator(field_size_limit_locator)).to_have_value("255")
    verify_column_type(page, PostgresType.CHARACTER_VARYING.id)
    page.locator(restrict_field_size_option_locator).set_checked(False)
    expect(page.locator(field_size_limit_locator)).not_to_be_visible()
    verify_column_type(page, PostgresType.TEXT.id)
