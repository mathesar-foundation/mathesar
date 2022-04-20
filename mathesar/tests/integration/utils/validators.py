from playwright.sync_api import expect


def expect_modal_to_be_visible(page, title):
    expect(page.locator("div.modal-wrapper div.modal")).to_be_visible()
    expect(page.locator("div.modal div.title")).to_contain_text(title)


def expect_modal_not_to_be_visible(page):
    expect(page.locator("div.modal-wrapper div.modal")).not_to_be_visible()


def expect_welcome_to_be_visible(page, welcome_text):
    h1_selector = "h1.empty-state"
    expect(page.locator(h1_selector)).to_be_visible()
    expect(page.locator(h1_selector)).to_contain_text(welcome_text)


def expect_tab_to_be_visible(page, table_name):
    table_tab = page.locator(f"a[role=\"tab\"] >> text={table_name}")
    expect(table_tab).to_be_visible()
