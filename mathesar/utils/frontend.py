import json

from django.conf import settings
from django.core.cache import cache


def get_manifest_data(preferred_language):
    # We don't need the manifest data for local development.
    if settings.MATHESAR_MODE == 'DEVELOPMENT':
        return {}

    manifest_data = cache.get('manifest_data')
    if manifest_data is not None:
        return manifest_data

    manifest_data = {}

    with open(settings.MATHESAR_MANIFEST_LOCATION, 'r') as manifest_file:
        raw_data = json.loads(manifest_file.read())

    translations_file_path = get_translations_file_path(preferred_language)

    module_data = raw_data['src/main.ts']
    manifest_data['module_css'] = [filename for filename in module_data['css']]
    manifest_data['module_js'] = module_data['file']

    # Purposefully letting it fail if the translations file for that lang is not in the bundle
    manifest_data['module_translations_file'] = raw_data[translations_file_path["module"]]["file"]

    legacy_data = raw_data['src/main-legacy.ts']
    manifest_data['legacy_polyfill_js'] = raw_data['vite/legacy-polyfills-legacy']['file']
    manifest_data['legacy_js'] = legacy_data['file']
    manifest_data['legacy_translations_file'] = raw_data[translations_file_path["legacy"]]["file"]

    # Cache data for 1 hour
    cache.set('manifest_data', manifest_data, 60 * 60)
    return manifest_data


def get_translations_file_path(preferred_language):
    return {
        "module": f'src/i18n/{preferred_language}/index.ts',
        "legacy": f'src/i18n/{preferred_language}/index-legacy.ts'
    }