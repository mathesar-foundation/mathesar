from config.branding_config import (
    BrandingConfig,
    build_branding_css,
    load_branding_config,
    logo_file_path_for_slot,
    logo_url_for_slot,
)


def test_load_branding_config_defaults_empty():
    assert load_branding_config({}) == BrandingConfig()


def test_load_branding_config_uses_auth_logo_url():
    config = load_branding_config({
        'MATHESAR_AUTH_LOGO_URL': 'https://example.com/logo.svg',
    })

    assert config.logo_urls['auth'] == 'https://example.com/logo.svg'


def test_load_branding_config_accepts_root_relative_and_data_logo_urls():
    data_url = 'data:image/svg+xml;base64,PHN2Zy8+'
    config = load_branding_config({
        'MATHESAR_AUTH_LOGO_URL': '/static/non-code/images/logo.svg',
        'MATHESAR_APP_HEADER_LOGO_URL': data_url,
    })

    assert config.logo_urls['auth'] == '/static/non-code/images/logo.svg'
    assert config.logo_urls['app-header'] == data_url


def test_load_branding_config_rejects_unsafe_logo_urls():
    config = load_branding_config({
        'MATHESAR_AUTH_LOGO_URL': 'javascript:alert(1)',
        'MATHESAR_APP_HEADER_LOGO_URL': 'data:text/html;base64,PGgxPm5vPC9oMT4=',
    })

    assert config.logo_urls == {}


def test_load_branding_config_accepts_supported_logo_files():
    config = load_branding_config({
        'MATHESAR_BRANDING_ASSET_DIR': '/tmp/branding',
        'MATHESAR_AUTH_LOGO_FILE': 'auth.svg',
        'MATHESAR_APP_HEADER_LOGO_DARK_FILE': 'app-dark.webp',
    })

    assert config.asset_dir == '/tmp/branding'
    assert config.logo_files == {
        'auth': 'auth.svg',
        'app-header-dark': 'app-dark.webp',
    }


def test_logo_url_for_slot_requires_servable_file(tmp_path):
    config = BrandingConfig(
        asset_dir=str(tmp_path),
        logo_files={'auth': 'missing.svg'},
    )

    assert logo_url_for_slot(config, 'auth') is None

    logo = tmp_path / 'missing.svg'
    logo.write_text('<svg />')

    assert logo_url_for_slot(config, 'auth') == '/branding-assets/auth/'


def test_load_branding_config_rejects_unsafe_logo_files():
    config = load_branding_config({
        'MATHESAR_BRANDING_ASSET_DIR': '/tmp/branding',
        'MATHESAR_AUTH_LOGO_FILE': '../auth.svg',
        'MATHESAR_APP_HEADER_LOGO_FILE': 'logo.exe',
    })

    assert config.logo_files == {}


def test_logo_file_path_resolves_under_asset_dir(tmp_path):
    logo = tmp_path / 'logo.svg'
    logo.write_text('<svg />')
    config = BrandingConfig(asset_dir=str(tmp_path), logo_files={'auth': 'logo.svg'})

    assert logo_file_path_for_slot(config, 'auth') == logo.resolve()


def test_logo_file_path_rejects_symlink_outside_asset_dir(tmp_path):
    outside = tmp_path.parent / 'outside-logo.svg'
    outside.write_text('<svg />')
    (tmp_path / 'logo.svg').symlink_to(outside)
    config = BrandingConfig(asset_dir=str(tmp_path), logo_files={'auth': 'logo.svg'})

    assert logo_file_path_for_slot(config, 'auth') is None


def test_load_branding_config_accepts_hex_color_and_generates_css():
    config = load_branding_config({
        'MATHESAR_THEME_COLOR_BRAND_ACCENT': '#123456',
        'MATHESAR_THEME_COLOR_DATABASE_IDENTITY': '#abc',
    })

    assert config.colors == {
        'brandAccent': '#123456',
        'databaseIdentity': '#aabbcc',
    }
    assert config.css.startswith('body.mathesar-has-branding {')
    assert '--color-brand: #123456;' in config.css
    assert '--color-brand-5: hsla(' in config.css
    assert '--color-brand-hover: hsl(' in config.css
    assert '--color-database: #aabbcc;' in config.css


def test_build_branding_css_matches_utility_token_algorithm():
    css = build_branding_css({'brandAccent': '#336699'})

    assert '--color-brand: #336699;' in css
    assert '--color-brand-5: hsla(210, 50%, 40%, 0.05);' in css
    assert '--color-brand-80: hsla(210, 50%, 40%, 0.8);' in css
    assert '--color-brand-hover: hsl(210, 53%, 37%);' in css
    assert '--color-brand-focused: hsl(210, 50%, 36%);' in css
    assert '--color-brand-active: hsl(210, 50%, 33%);' in css
    assert '--color-brand-25-active: hsla(210, 50%, 33%, 0.25);' in css


def test_load_branding_config_rejects_invalid_color_values():
    config = load_branding_config({
        'MATHESAR_THEME_COLOR_BRAND_ACCENT': 'tomato',
        'MATHESAR_THEME_COLOR_DATABASE_IDENTITY': '#abcd',
    })

    assert config.colors == {}
    assert config.css == ''


def test_build_branding_css_returns_empty_string_without_colors():
    assert build_branding_css({}) == ''
