import json
import os
from pathlib import Path
import subprocess
import sys
import textwrap


PUBLIC_ENTRY_ENV_NAMES = (
    'MATHESAR_LANDING_PAGE_URL',
    'MATHESAR_INSTANCE_NAME',
    'MATHESAR_AUTH_LOGO_URL',
    'MATHESAR_AUTH_LOGO_FILE',
    'MATHESAR_APP_HEADER_LOGO_URL',
    'MATHESAR_APP_HEADER_LOGO_DARK_URL',
    'MATHESAR_APP_HEADER_LOGO_FILE',
    'MATHESAR_APP_HEADER_LOGO_DARK_FILE',
    'MATHESAR_BRANDING_ASSET_DIR',
    'MATHESAR_THEME_COLOR_BRAND_ACCENT',
    'MATHESAR_THEME_COLOR_MUTED_BRAND_ACCENT',
    'MATHESAR_THEME_COLOR_PRIMARY_ACTION',
    'MATHESAR_THEME_COLOR_SECONDARY_ACTION',
    'MATHESAR_THEME_COLOR_NAVIGATION_ACCENT',
    'MATHESAR_THEME_COLOR_REFERENCE_ACCENT',
    'MATHESAR_THEME_COLOR_FOCUS_ACCENT',
    'MATHESAR_THEME_COLOR_CONFIRMATION_ACCENT',
    'MATHESAR_THEME_COLOR_DATABASE_IDENTITY',
    'MATHESAR_THEME_COLOR_SCHEMA_IDENTITY',
    'MATHESAR_THEME_COLOR_TABLE_IDENTITY',
    'MATHESAR_THEME_COLOR_VIEW_IDENTITY',
    'MATHESAR_THEME_COLOR_COLUMN_IDENTITY',
    'MATHESAR_THEME_COLOR_RECORD_IDENTITY',
    'MATHESAR_THEME_COLOR_FOREIGN_RECORD_IDENTITY',
    'MATHESAR_THEME_COLOR_EXPLORATION_IDENTITY',
    'MATHESAR_THEME_COLOR_DATA_FORM_IDENTITY',
    'MATHESAR_LOGIN_PAGE_HEADING',
    'MATHESAR_LOGIN_PAGE_BODY',
    'MATHESAR_LOGIN_PAGE_BACKGROUND',
    'MATHESAR_TERMS_OF_SERVICE_URL',
    'MATHESAR_PRIVACY_POLICY_URL',
)

PUBLIC_ENTRY_SETTING_NAMES = (
    'MATHESAR_LANDING_PAGE_URL',
    'MATHESAR_INSTANCE_NAME',
    'MATHESAR_AUTH_LOGO_URL',
    'MATHESAR_AUTH_LOGO_FILE',
    'MATHESAR_APP_HEADER_LOGO_URL',
    'MATHESAR_APP_HEADER_LOGO_DARK_URL',
    'MATHESAR_APP_HEADER_LOGO_FILE',
    'MATHESAR_APP_HEADER_LOGO_DARK_FILE',
    'MATHESAR_BRANDING_ASSET_DIR',
    'MATHESAR_BRANDING_CSS',
    'MATHESAR_LOGIN_PAGE_HEADING',
    'MATHESAR_LOGIN_PAGE_BODY',
    'MATHESAR_LOGIN_PAGE_BACKGROUND',
    'MATHESAR_TERMS_OF_SERVICE_URL',
    'MATHESAR_PRIVACY_POLICY_URL',
)


def _load_common_settings(env_overrides=None):
    env = os.environ.copy()
    for name in PUBLIC_ENTRY_ENV_NAMES:
        env.pop(name, None)
    env.update(env_overrides or {})

    code = textwrap.dedent(f"""
        import json
        from config.settings import common_settings

        setting_names = {PUBLIC_ENTRY_SETTING_NAMES!r}
        print(json.dumps({{
            name: getattr(common_settings, name)
            for name in setting_names
        }}, sort_keys=True))
    """)
    result = subprocess.run(
        [sys.executable, '-c', code],
        cwd=Path(__file__).resolve().parents[3],
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def test_public_entry_settings_default_values():
    assert _load_common_settings() == {
        'MATHESAR_LANDING_PAGE_URL': None,
        'MATHESAR_INSTANCE_NAME': 'Mathesar',
        'MATHESAR_AUTH_LOGO_URL': None,
        'MATHESAR_AUTH_LOGO_FILE': None,
        'MATHESAR_APP_HEADER_LOGO_URL': None,
        'MATHESAR_APP_HEADER_LOGO_DARK_URL': None,
        'MATHESAR_APP_HEADER_LOGO_FILE': None,
        'MATHESAR_APP_HEADER_LOGO_DARK_FILE': None,
        'MATHESAR_BRANDING_ASSET_DIR': None,
        'MATHESAR_BRANDING_CSS': '',
        'MATHESAR_LOGIN_PAGE_HEADING': None,
        'MATHESAR_LOGIN_PAGE_BODY': None,
        'MATHESAR_LOGIN_PAGE_BACKGROUND': None,
        'MATHESAR_TERMS_OF_SERVICE_URL': None,
        'MATHESAR_PRIVACY_POLICY_URL': None,
    }


def test_public_entry_settings_read_mathesar_env_vars():
    assert _load_common_settings({
        'MATHESAR_LANDING_PAGE_URL': 'https://example.com/start',
        'MATHESAR_INSTANCE_NAME': 'Mathesar Cloud',
        'MATHESAR_AUTH_LOGO_URL': 'https://example.com/logo.svg',
        'MATHESAR_AUTH_LOGO_FILE': 'auth.svg',
        'MATHESAR_APP_HEADER_LOGO_URL': 'https://example.com/app-logo.svg',
        'MATHESAR_APP_HEADER_LOGO_DARK_URL': 'https://example.com/app-logo-dark.svg',
        'MATHESAR_APP_HEADER_LOGO_FILE': 'app.svg',
        'MATHESAR_APP_HEADER_LOGO_DARK_FILE': 'app-dark.svg',
        'MATHESAR_BRANDING_ASSET_DIR': '/tmp/branding',
        'MATHESAR_LOGIN_PAGE_HEADING': 'Welcome to Mathesar Cloud',
        'MATHESAR_LOGIN_PAGE_BODY': 'Sign in to start working.',
        'MATHESAR_LOGIN_PAGE_BACKGROUND': 'linear-gradient(#123842, #0b222b)',
        'MATHESAR_TERMS_OF_SERVICE_URL': 'https://example.com/terms',
        'MATHESAR_PRIVACY_POLICY_URL': 'https://example.com/privacy',
    }) == {
        'MATHESAR_LANDING_PAGE_URL': 'https://example.com/start',
        'MATHESAR_INSTANCE_NAME': 'Mathesar Cloud',
        'MATHESAR_AUTH_LOGO_URL': 'https://example.com/logo.svg',
        'MATHESAR_AUTH_LOGO_FILE': 'auth.svg',
        'MATHESAR_APP_HEADER_LOGO_URL': 'https://example.com/app-logo.svg',
        'MATHESAR_APP_HEADER_LOGO_DARK_URL': 'https://example.com/app-logo-dark.svg',
        'MATHESAR_APP_HEADER_LOGO_FILE': 'app.svg',
        'MATHESAR_APP_HEADER_LOGO_DARK_FILE': 'app-dark.svg',
        'MATHESAR_BRANDING_ASSET_DIR': '/tmp/branding',
        'MATHESAR_BRANDING_CSS': '',
        'MATHESAR_LOGIN_PAGE_HEADING': 'Welcome to Mathesar Cloud',
        'MATHESAR_LOGIN_PAGE_BODY': 'Sign in to start working.',
        'MATHESAR_LOGIN_PAGE_BACKGROUND': 'linear-gradient(#123842, #0b222b)',
        'MATHESAR_TERMS_OF_SERVICE_URL': 'https://example.com/terms',
        'MATHESAR_PRIVACY_POLICY_URL': 'https://example.com/privacy',
    }


def test_new_public_entry_settings_treat_empty_strings_as_unset():
    settings = _load_common_settings({
        'MATHESAR_LANDING_PAGE_URL': '',
        'MATHESAR_INSTANCE_NAME': '',
        'MATHESAR_AUTH_LOGO_URL': '',
        'MATHESAR_AUTH_LOGO_FILE': '',
        'MATHESAR_APP_HEADER_LOGO_URL': '',
        'MATHESAR_APP_HEADER_LOGO_DARK_URL': '',
        'MATHESAR_APP_HEADER_LOGO_FILE': '',
        'MATHESAR_APP_HEADER_LOGO_DARK_FILE': '',
        'MATHESAR_BRANDING_ASSET_DIR': '',
        'MATHESAR_LOGIN_PAGE_HEADING': '',
        'MATHESAR_LOGIN_PAGE_BODY': '',
        'MATHESAR_LOGIN_PAGE_BACKGROUND': '',
    })

    assert settings['MATHESAR_LANDING_PAGE_URL'] is None
    assert settings['MATHESAR_INSTANCE_NAME'] == 'Mathesar'
    assert settings['MATHESAR_AUTH_LOGO_URL'] is None
    assert settings['MATHESAR_AUTH_LOGO_FILE'] is None
    assert settings['MATHESAR_APP_HEADER_LOGO_URL'] is None
    assert settings['MATHESAR_APP_HEADER_LOGO_DARK_URL'] is None
    assert settings['MATHESAR_APP_HEADER_LOGO_FILE'] is None
    assert settings['MATHESAR_APP_HEADER_LOGO_DARK_FILE'] is None
    assert settings['MATHESAR_BRANDING_ASSET_DIR'] is None
    assert settings['MATHESAR_BRANDING_CSS'] == ''
    assert settings['MATHESAR_LOGIN_PAGE_HEADING'] is None
    assert settings['MATHESAR_LOGIN_PAGE_BODY'] is None
    assert settings['MATHESAR_LOGIN_PAGE_BACKGROUND'] is None


def test_public_entry_settings_generate_branding_css_from_theme_env_vars():
    settings = _load_common_settings({
        'MATHESAR_THEME_COLOR_MUTED_BRAND_ACCENT': '#147987',
        'MATHESAR_THEME_COLOR_REFERENCE_ACCENT': '#e65846',
        'MATHESAR_THEME_COLOR_FOCUS_ACCENT': '#55b7c5',
        'MATHESAR_THEME_COLOR_CONFIRMATION_ACCENT': '#1fbd83',
    })

    assert settings['MATHESAR_BRANDING_CSS'].startswith('body.mathesar-has-branding {')
    assert '--color-brand-subtle: #147987;' in settings['MATHESAR_BRANDING_CSS']
    assert '--color-highlight-a: #e65846;' in settings['MATHESAR_BRANDING_CSS']
    assert '--color-highlight-b: #55b7c5;' in settings['MATHESAR_BRANDING_CSS']
    assert '--color-highlight-c: #1fbd83;' in settings['MATHESAR_BRANDING_CSS']
