from django.conf import settings
from django.templatetags.static import static


from mathesar.utils.frontend import get_manifest_data


def frontend_settings(request):
    manifest_data = get_manifest_data()
    development_mode = settings.MATHESAR_MODE == 'DEVELOPMENT'

    i18n_settings = get_i18n_settings(manifest_data, development_mode)
    frontend_settings = {
        'development_mode': development_mode,
        'manifest_data': manifest_data,
        'live_demo_mode': getattr(settings, 'MATHESAR_LIVE_DEMO', False),
        'live_demo_username': getattr(settings, 'MATHESAR_LIVE_DEMO_USERNAME', None),
        'live_demo_password': getattr(settings, 'MATHESAR_LIVE_DEMO_PASSWORD', None),
        **i18n_settings
    }
    # Only include development URL if we're in development mode.
    if frontend_settings['development_mode'] is True:
        frontend_settings['client_dev_url'] = settings.MATHESAR_CLIENT_DEV_URL

    return frontend_settings


def get_i18n_settings(manifest_data, development_mode):
    """
    Hard coding this for now
    but will be taken from users model
    and cookies later on
    """
    display_language = 'en'
    fallback_language = 'en'

    client_dev_url = settings.MATHESAR_CLIENT_DEV_URL

    if development_mode is True:
        module_translations_file_path = f'{client_dev_url}/src/i18n/{display_language}/index.ts'
        legacy_translations_file_path = f'{client_dev_url}/src/i18n/{display_language}/index.ts'
    else:
        try:
            module_translations_file_path = static(manifest_data[display_language]["file"])
            legacy_translations_file_path = static(manifest_data[f"{display_language}-legacy"]["file"])
        except KeyError:
            module_translations_file_path = static(manifest_data[fallback_language]["file"])
            legacy_translations_file_path = static(manifest_data[f"{fallback_language}-legacy"]["file"])

    return {
        'module_translations_file_path': module_translations_file_path,
        'legacy_translations_file_path': legacy_translations_file_path,
        'display_language': display_language
    }
