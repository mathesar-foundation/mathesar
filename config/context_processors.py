from django.conf import settings

from mathesar.utils.frontend import get_manifest_data


def frontend_settings(request):
    frontend_settings = {
        'development_mode': settings.MATHESAR_MODE == 'DEVELOPMENT',
        'manifest_data': get_manifest_data(),
        'live_demo_mode': getattr(settings, 'MATHESAR_LIVE_DEMO', False)
    }
    # Only include development URL if we're in development mode.
    if frontend_settings['development_mode'] is True:
        frontend_settings['client_dev_url'] = settings.MATHESAR_CLIENT_DEV_URL
    return frontend_settings
