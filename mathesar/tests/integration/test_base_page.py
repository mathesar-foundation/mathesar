def test_page_shows_welcome_text(page, live_server):
    page.goto(f"{live_server}")
    assert page.inner_text('h1') == 'Welcome to Mathesar!'
