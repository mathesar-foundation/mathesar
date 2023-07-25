from django.conf import settings

from mathesar.utils.frontend import get_manifest_data


def frontend_settings(request):
    preferred_language=get_user_preferred_language_from_request(request)
    frontend_settings = {
        'development_mode': settings.MATHESAR_MODE == 'DEVELOPMENT',
        'preferred_language': preferred_language,
        'manifest_data': get_manifest_data(preferred_language),
        'live_demo_mode': getattr(settings, 'MATHESAR_LIVE_DEMO', False),
        'live_demo_username': getattr(settings, 'MATHESAR_LIVE_DEMO_USERNAME', None),
        'live_demo_password': getattr(settings, 'MATHESAR_LIVE_DEMO_PASSWORD', None),
    }
    # Only include development URL if we're in development mode.
    if frontend_settings['development_mode'] is True:
        frontend_settings['client_dev_url'] = settings.MATHESAR_CLIENT_DEV_URL
    return frontend_settings


def get_user_preferred_language_from_request(request):
    # https://docs.djangoproject.com/en/4.2/topics/i18n/translation/#how-django-discovers-language-preference
    # This automatically fallbacks to en because of https://docs.djangoproject.com/en/4.2/ref/settings/#std-setting-LANGUAGE_CODE
    lang_from_locale_middleware = request.LANGUAGE_CODE

    if request.user.is_authenticated:
        return request.user.preferred_language or lang_from_locale_middleware
    else:
        return lang_from_locale_middleware
