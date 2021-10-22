def test_base_page(page):
    page.goto('http://localhost:8000')
    assert page.inner_text('h1') == 'Welcome to Mathesar!'
