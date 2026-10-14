import json
import os
from pathlib import Path
import subprocess
import sys
import textwrap

import pytest


DJANGO_ADMIN_ENV_NAME = 'MATHESAR_DJANGO_ADMIN_ENABLED'


def _run_python(code, env_overrides=None):
    env = os.environ.copy()
    env.pop(DJANGO_ADMIN_ENV_NAME, None)
    env.update(env_overrides or {})

    result = subprocess.run(
        [sys.executable, '-c', textwrap.dedent(code)],
        cwd=Path(__file__).resolve().parents[3],
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def _load_admin_settings(env_value=None):
    env_overrides = {'DJANGO_SETTINGS_MODULE': 'config.settings.production'}
    if env_value is not None:
        env_overrides[DJANGO_ADMIN_ENV_NAME] = env_value

    return _run_python(
        """
        import json

        import django
        from django.conf import settings

        django.setup()

        print(json.dumps({
            "admin_enabled": settings.MATHESAR_DJANGO_ADMIN_ENABLED,
            "admin_installed": "django.contrib.admin" in settings.INSTALLED_APPS,
        }, sort_keys=True))
        """,
        env_overrides,
    )


def _load_admin_url_state(env_value=None):
    env_overrides = {'DJANGO_SETTINGS_MODULE': 'config.settings.production'}
    if env_value is not None:
        env_overrides[DJANGO_ADMIN_ENV_NAME] = env_value

    return _run_python(
        """
        import json

        import django
        from django.urls import Resolver404, resolve

        django.setup()

        import config.urls

        def resolves(path):
            try:
                match = resolve(path)
            except Resolver404:
                return None
            return match.view_name

        print(json.dumps({
            "admin_route_mounted": any(
                str(pattern.pattern) == "admin/"
                for pattern in config.urls.urlpatterns
            ),
            "admin_view_name": resolves("/admin/"),
            "login_view_name": resolves("/auth/login/"),
            "mathesar_admin_view_name": resolves("/administration/"),
        }, sort_keys=True))
        """,
        env_overrides,
    )


@pytest.mark.parametrize('env_value', [None, '', 'false', 'False', '0', 'no'])
def test_django_admin_setting_disabled_values(env_value):
    assert _load_admin_settings(env_value) == {
        'admin_enabled': False,
        'admin_installed': False,
    }


@pytest.mark.parametrize('env_value', ['t', 'true', 'True'])
def test_django_admin_setting_enabled_values(env_value):
    assert _load_admin_settings(env_value) == {
        'admin_enabled': True,
        'admin_installed': True,
    }


def test_django_admin_url_is_not_mounted_by_default():
    assert _load_admin_url_state() == {
        'admin_route_mounted': False,
        'admin_view_name': None,
        'login_view_name': 'login',
        'mathesar_admin_view_name': 'admin_home',
    }


def test_django_admin_url_is_mounted_when_enabled():
    assert _load_admin_url_state('true') == {
        'admin_route_mounted': True,
        'admin_view_name': 'admin:index',
        'login_view_name': 'login',
        'mathesar_admin_view_name': 'admin_home',
    }
