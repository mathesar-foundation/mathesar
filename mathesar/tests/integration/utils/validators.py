from playwright.sync_api import expect


def expect_modal_to_be_visible(page, title):
    expect(page.locator("div.modal-wrapper")).to_be_visible()
    expect(page.locator("div.modal")).to_be_visible()
    expect(page.locator("div.modal div.title")).to_contain_text(title)


def expect_modal_not_to_be_visible(page):
    expect(page.locator("div.modal")).not_to_be_visible()
    expect(page.locator("div.modal-wrapper")).not_to_be_visible()


def expect_welcome_to_be_visible(page, welcome_text):
    h1_selector = "h1.empty-state"
    expect(page.locator(h1_selector)).to_be_visible()
    expect(page.locator(h1_selector)).to_contain_text(welcome_text)
