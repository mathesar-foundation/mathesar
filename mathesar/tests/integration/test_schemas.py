from playwright.sync_api import Page, expect


def test_create_schema(page: Page, schemas_page_url):
    page.goto(schemas_page_url)
    page.pause()
    schema_name = "foo"
    schema_entry = page.locator(f".schema-list .schema-row:has-text('{schema_name}')")
    expect(schema_entry).not_to_be_visible()
    page.click("text=New Schema")
    page.fill("[aria-label='name']", schema_name)
    page.click("button:has-text('Save')")
    expect(schema_entry).to_be_visible()
