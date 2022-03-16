from playwright.sync_api import expect, Page


def expect_modal_to_be_visible(page: Page, title):
    expect(page.locator("div.modal-wrapper div.modal")).to_be_visible()
    expect(page.locator("div.modal div.title")).to_contain_text(title)


def expect_modal_not_to_be_visible(page: Page):
    expect(page.locator("div.modal-wrapper div.modal")).not_to_be_visible()


def expect_welcome_to_be_visible(page: Page, welcome_text):
    h1_selector = "h1.empty-state"
    expect(page.locator(h1_selector)).to_be_visible()
    expect(page.locator(h1_selector)).to_contain_text(welcome_text)
