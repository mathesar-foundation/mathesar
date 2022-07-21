from playwright.sync_api import expect


def change_select_input_value(page, select_menu_locator, new_value):
    dropdown_id = select_menu_locator.get_attribute("aria-controls")
    dropdown_selector = f".dropdown.select:has(ul#{dropdown_id})"
    expect(page.locator(dropdown_selector)).not_to_be_visible()
    select_menu_locator.click()
    expect(page.locator(dropdown_selector)).to_be_visible()
    page.click(f"{dropdown_selector} li:has-text('{new_value}')")
    expect(page.locator(dropdown_selector)).not_to_be_visible()
    expect(select_menu_locator).to_contain_text(new_value, use_inner_text=True)
