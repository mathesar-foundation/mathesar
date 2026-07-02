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
    'MATHESAR_LOGIN_PAGE_TEXT_DICT',
    'MATHESAR_LOGIN_PAGE_BACKGROUND',
    'MATHESAR_TERMS_OF_SERVICE_URL',
    'MATHESAR_PRIVACY_POLICY_URL',
)

PUBLIC_ENTRY_SETTING_NAMES = (
    'MATHESAR_LANDING_PAGE_URL',
    'MATHESAR_INSTANCE_NAME',
    'MATHESAR_AUTH_LOGO_URL',
    'MATHESAR_LOGIN_PAGE_TEXT',
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
        'MATHESAR_LOGIN_PAGE_TEXT': {},
        'MATHESAR_LOGIN_PAGE_BACKGROUND': None,
        'MATHESAR_TERMS_OF_SERVICE_URL': None,
        'MATHESAR_PRIVACY_POLICY_URL': None,
    }


def test_public_entry_settings_read_mathesar_env_vars():
    assert _load_common_settings({
        'MATHESAR_LANDING_PAGE_URL': 'https://example.com/start',
        'MATHESAR_INSTANCE_NAME': 'Mathesar Cloud',
        'MATHESAR_AUTH_LOGO_URL': 'https://example.com/logo.svg',
        'MATHESAR_LOGIN_PAGE_TEXT_DICT': (
            '{"heading": "Welcome to your Mathesar workspace",'
            ' "body": "Sign in to start working.",'
            ' "translations": {"es": {"heading": "Bienvenido"}}}'
        ),
        'MATHESAR_LOGIN_PAGE_BACKGROUND': 'linear-gradient(#123842, #0b222b)',
        'MATHESAR_TERMS_OF_SERVICE_URL': 'https://example.com/terms',
        'MATHESAR_PRIVACY_POLICY_URL': 'https://example.com/privacy',
    }) == {
        'MATHESAR_LANDING_PAGE_URL': 'https://example.com/start',
        'MATHESAR_INSTANCE_NAME': 'Mathesar Cloud',
        'MATHESAR_AUTH_LOGO_URL': 'https://example.com/logo.svg',
        'MATHESAR_LOGIN_PAGE_TEXT': {
            'heading': 'Welcome to your Mathesar workspace',
            'body': 'Sign in to start working.',
            'translations': {'es': {'heading': 'Bienvenido'}},
        },
        'MATHESAR_LOGIN_PAGE_BACKGROUND': 'linear-gradient(#123842, #0b222b)',
        'MATHESAR_TERMS_OF_SERVICE_URL': 'https://example.com/terms',
        'MATHESAR_PRIVACY_POLICY_URL': 'https://example.com/privacy',
    }


def test_new_public_entry_settings_treat_empty_strings_as_unset():
    settings = _load_common_settings({
        'MATHESAR_LANDING_PAGE_URL': '',
        'MATHESAR_INSTANCE_NAME': '',
        'MATHESAR_AUTH_LOGO_URL': '',
        'MATHESAR_LOGIN_PAGE_TEXT_DICT': '',
        'MATHESAR_LOGIN_PAGE_BACKGROUND': '',
    })

    assert settings['MATHESAR_LANDING_PAGE_URL'] is None
    assert settings['MATHESAR_INSTANCE_NAME'] == 'Mathesar'
    assert settings['MATHESAR_AUTH_LOGO_URL'] is None
    assert settings['MATHESAR_LOGIN_PAGE_TEXT'] == {}
    assert settings['MATHESAR_LOGIN_PAGE_BACKGROUND'] is None
