def test_base_page(page):
    page.goto('http://localhost:8000')
    page.once('load', lambda: print(page.content()))
    assert page.inner_text('h1') == 'Welcome to Mathesar!'
