from django.conf import settings

from mathesar.utils.frontend import get_manifest_data


def frontend_settings(request):
    """
    Hard coding this for now
    but will be taken from users model
    and cookies later on
    """
    preferred_language = 'en'
    frontend_settings = {
        'development_mode': settings.MATHESAR_MODE == 'DEVELOPMENT',
        'manifest_data': get_manifest_data(preferred_language),
        'preferred_language': preferred_language,
        'live_demo_mode': getattr(settings, 'MATHESAR_LIVE_DEMO', False),
        'live_demo_username': getattr(settings, 'MATHESAR_LIVE_DEMO_USERNAME', None),
        'live_demo_password': getattr(settings, 'MATHESAR_LIVE_DEMO_PASSWORD', None),
    }
    # Only include development URL if we're in development mode.
    if frontend_settings['development_mode'] is True:
        frontend_settings['client_dev_url'] = settings.MATHESAR_CLIENT_DEV_URL
    return frontend_settings
