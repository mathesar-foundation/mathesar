from django.conf import settings
from django.templatetags.static import static


from mathesar.utils.frontend import get_manifest_data


def frontend_settings(request):
    manifest_data = get_manifest_data()
    development_mode = settings.MATHESAR_MODE == 'DEVELOPMENT'
    display_language = get_display_language_from_request(request)
    fallback_language = settings.FALLBACK_LANGUAGE

    frontend_settings = {
        'development_mode': development_mode,
        'manifest_data': manifest_data,
        'live_demo_mode': getattr(settings, 'MATHESAR_LIVE_DEMO', False),
        'live_demo_username': getattr(settings, 'MATHESAR_LIVE_DEMO_USERNAME', None),
        'live_demo_password': getattr(settings, 'MATHESAR_LIVE_DEMO_PASSWORD', None),
        'display_language': display_language,
        'include_i18n_fallback': display_language != fallback_language,
    }
    # Only include development URL if we're in development mode.
    if frontend_settings['development_mode'] is True:
        frontend_settings['client_dev_url'] = settings.MATHESAR_CLIENT_DEV_URL
        i18n_settings = get_i18n_settings_dev(display_language)
    else:
        i18n_settings = get_i18n_settings_prod(display_language, manifest_data)

    frontend_settings = { **frontend_settings, **i18n_settings }

    return frontend_settings


def get_display_language_from_request(request):
    # https://docs.djangoproject.com/en/4.2/topics/i18n/translation/#how-django-discovers-language-preference
    # This automatically fallbacks to en because of https://docs.djangoproject.com/en/4.2/ref/settings/#std-setting-LANGUAGE_CODE
    lang_from_locale_middleware = request.LANGUAGE_CODE

    if request.user.is_authenticated:
        return request.user.display_language or lang_from_locale_middleware
    else:
        return lang_from_locale_middleware


def get_i18n_settings_dev(display_language):
    client_dev_url = settings.MATHESAR_CLIENT_DEV_URL
    fallback_language = settings.FALLBACK_LANGUAGE

    return {
        'dev_display_language_url': f'{client_dev_url}/src/i18n/languages/{display_language}/index.ts',
        'dev_fallback_language_url': f'{client_dev_url}/src/i18n/languages/{fallback_language}/index.ts',
    }


def get_prod_translation_file_urls(language, manifest_data):
    prod_module_url = static(manifest_data[f"language_{language}"]["file"])
    prod_legacy_url = static(manifest_data[f"language_{language}_legacy"]["file"])

    return {
        'module': prod_module_url,
        'legacy': prod_legacy_url,
    }


def get_i18n_settings_prod(display_language, manifest_data):
    fallback_language = settings.FALLBACK_LANGUAGE

    display_language_urls = get_prod_translation_file_urls(display_language, manifest_data)
    fallback_language_urls = get_prod_translation_file_urls(fallback_language, manifest_data)

    return {
        'prod_display_language_urls': display_language_urls,
        'prod_fallback_language_urls': fallback_language_urls,
    }
