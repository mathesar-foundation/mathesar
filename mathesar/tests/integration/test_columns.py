from playwright.sync_api import expect


def test_add_column(page, go_to_patents_data_table):
    page.click("button[aria-label='New Column']")
    column_name = "TEST"
    page.fill(".new-column-dropdown input", column_name)
    page.click("button:has-text('Add')")
    column_header = f".table-content .header .cell .name:has-text('{column_name}')"
    expect(page.locator(column_header)).to_be_visible()

def test_convert_boolean_col_to_text_col(page, base_schema_url):
    page.goto(base_schema_url)
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Import Data')")
    page.click("text=Copy and Paste Text")
    page.fill("textarea", "foo,bar\ntrue,false")
    page.click("button:has-text('Continue')")
    page.click("button:has-text('Finish Import')")
    page.click("button:has-text('foo')")
    page.click("button:has-text('Boolean')")
    page.click("text=T Text")
    page.click("button:has-text('Save')")
    page.locator(".dropdown .container .section .btn:has-text('Text')")