import pytest
import importlib
import mathesar.templatetags.client_files as client_files
from django.template import Template, Context


def test_client_links_development(settings):
    settings.MODE = 'DEVELOPMENT'
    importlib.reload(client_files)
    rendered = Template('{% load client_files %}{% get_assets %}').render(Context())
    assert rendered == (
        f'<script type="module" src="{settings.CLIENT_DEV_URL}/@vite/client"></script>\n'
        f'<script type="module" src="{settings.CLIENT_DEV_URL}/src/main.ts"></script>'
    )


def test_client_links_production(settings):
    settings.MODE = "PRODUCTION"
    settings.CLIENT_BUILD_LOCATION = 'mathesar/tests/data/client_build/'
    importlib.reload(client_files)
    rendered = Template('{% load client_files %}{% get_assets %}').render(Context())
    assert rendered == (
        '<link rel="stylesheet" href="/static/assets/main.57ee229b.css">\n'
        '<link rel="modulepreload" href="/static/assets/vendor.9a7b32d4.js">\n'
        '<script type="module" src="/static/assets/main.cda2bafc.js"></script>\n'
        '<script nomodule src="/static/assets/polyfills-legacy.b378e49a.js"></script>\n'
        '<script nomodule src="/static/assets/vendor-legacy.d63fc969.js"></script>\n'
        '<script nomodule id="vite-legacy-entry" data-src="/static/assets/main-legacy.a6fa5c22.js">\n'
        '\tSystem.import(document.getElementById("vite-legacy-entry").getAttribute("data-src"))\n'
        '</script>'
    )


def test_throw_error_manifest_not_found(settings):
    settings.MODE = 'PRODUCTION'
    settings.CLIENT_BUILD_LOCATION = 'mathesar/tests/data/'
    importlib.reload(client_files)
    with pytest.raises(RuntimeError, match=r'\bUnable to load client build manifest file\b'):
        Template('{% load client_files %}{% get_assets %}').render(Context())
