from playwright.sync_api import expect


def test_add_and_remove_multi_column_unique_constraint(page, go_to_patents_data_table):
    # Add
    page.click("[aria-label='Table Actions']")
    page.click("text=Constraints")
    page.click("[aria-label='New Constraint']")
    page.click("button:has-text('Unique')")
    page.click("fieldset >> text=Center")
    page.click("fieldset >> text=Case Number")
    page.click("button:has-text('Add')")
    column_names = "Center, Case Number"
    constraint = page.locator(
        f".table-constraint:has(.type:has-text('unique')):has(.columns:has-text('{column_names}'))"
    )
    expect(page.locator("text=Table Constraints (2)")).to_be_visible()
    expect(constraint).to_be_visible()

    # Remove
    constraint.locator(".drop button").click()
    page.click("button:has-text('Delete Constraint')")
    expect(constraint).not_to_be_visible()
    expect(page.locator("text=Table Constraints (1)")).to_be_visible()


def test_try_to_dissallow_null_for_column_with_null_values(page, go_to_patents_data_table):
    page.click("button:has-text('Patent Number')")
    allow_null = page.locator("button:has-text('Allow NULL')")
    allow_null.click()
    expect(page.locator(".toast-item:has-text('Unable to update')")).to_be_visible()
    expect(allow_null).to_be_visible()
