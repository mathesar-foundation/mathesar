from playwright.sync_api import expect


def test_create_and_delete_schema(page, schemas_page_url):
    page.goto(schemas_page_url)
    schema_name = "foo"
    schema_entry = page.locator(f".schema-list .schema-row:has-text('{schema_name}')")
    expect(schema_entry).not_to_be_visible()
    page.click("text=New Schema")
    page.fill("[aria-label='name']", schema_name)
    page.click("button:has-text('Save')")
    expect(schema_entry).to_be_visible()
    # We're also deleting the schema in the same test as a way of cleaning up
    # the state created in this test so as not to interfer with other tests.
    # This is a hack for now.
    schema_entry.locator("button[aria-label='Delete Schema']").click()
    page.click("button:has-text('Delete Schema')")
    expect(schema_entry).not_to_be_visible()
