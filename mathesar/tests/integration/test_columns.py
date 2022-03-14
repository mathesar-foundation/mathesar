from playwright.sync_api import expect


def test_add_column(page, go_to_patents_data_table):
    page.click("button[aria-label='New Column']")
    column_name = "TEST"
    page.fill(".new-column-dropdown input", column_name)
    page.click("button:has-text('Add')")
    column_header = f".table-content .header .cell .name:has-text('{column_name}')"
    expect(page.locator(column_header)).to_be_visible()


def test_convert_text_col_of_num_to_num_col(page, patent_schema, base_schema_url):
    page.goto(base_schema_url)
    page.click("[aria-label='New Table']")
    page.click("button:has-text('Empty Table')")
    page.click("[aria-label='New Column']")
    page.fill(".new-column-dropdown input", 'foo')
    page.click("button:has-text('Add')")
    page.click(".sheet-cell .cell-wrapper.multi-line-truncate")
    page.dblclick(".cell-wrapper.multi-line-truncate")
    page.fill("textarea", '123')
    page.click(".row.done.is-add-placeholder .cell.editable-cell .sheet-cell .cell-wrapper")
    page.dblclick("text=NULL")
    page.fill("textarea", '876')
    all_changes_saved = page.locator("text=All changes saved")
    expect(all_changes_saved).to_be_visible()
    page.click("button:has-text('T foo')")
    page.click("button:has-text('Text')")
    page.click("text=# Number")
    page.click("button:has-text('Save')")
    page.click("button:has-text('# foo')")
    page.locator(".dropdown .container .section .btn:has-text('Number')")
