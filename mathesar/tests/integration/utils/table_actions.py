from playwright.sync_api import expect
from mathesar.tests.integration.conftest import TIMEOUT_HACK
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


def close_tab(tab_locator):
    tab_locator.hover()
    tab_locator.locator("[aria-label=remove]").click()


def rename_table(page, new_name):
    page.click("button[aria-label='Table']")
    page.click("button:has-text('Rename')")
    expect_modal_to_be_visible(page, "Rename Table 0 Table")
    page.fill("div.modal input[aria-label='name']", new_name)
    page.click("div.cancel-or-proceed-button-pair span:has-text('Save')")
    expect_modal_not_to_be_visible(page)


def rename_column(page, old_name, new_name):
    page.click(f"button:has-text('{old_name}')")
    page.click("button:has-text('Rename')")
    page.fill("[aria-label='Column name']", new_name)
    page.keyboard.press("Enter")


def get_column_header_locator(page, column_name):
    column_header = f":nth-match(.table-content .header .cell .name:has-text('{column_name}'), 1)"
    expect(page.locator(column_header)).to_be_visible()
    return column_header


def open_column_options(page, column_name, column_type):
    page.click(get_column_header_locator(page, column_name))
    type_option = "button.type-switch"
    expect(page.locator(type_option)).to_contain_text(column_type, **TIMEOUT_HACK)
    page.click(type_option)
    expect(page.locator(".type-list li.selected")).to_contain_text(column_type, **TIMEOUT_HACK)


def open_column_options_and_verify_type(page, column_name, column_type, db_type):
    open_column_options(page, column_name, column_type)
    db_type_text = f"Database type {db_type}"
    expect(page.locator(".type-options-content")).to_contain_text(db_type_text, use_inner_text=True, **TIMEOUT_HACK)


def get_cell_selector(page, table, row_number, column_name):
    column_names_to_ids = table.get_column_name_id_bidirectional_map()
    column_id = column_names_to_ids[column_name]
    row_selector = f".table-content .row:has(.row-control .control .number:text('{row_number}'))"
    cell_selector = f"{row_selector} .cell:has([data-column-id='{column_id}'])"
    cell_locator = page.locator(cell_selector)
    expect(cell_locator).to_be_visible()
    return cell_selector


def get_default_value_checkbox(page):
    default_value_cb_selector = "span:has-text('Set Default Value') input[type='checkbox']"
    cb_locator = page.locator(default_value_cb_selector)
    expect(cb_locator).to_be_visible()
    return cb_locator
