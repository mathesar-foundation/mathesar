from django.conf import settings


def get_settings(request):
    return {
        'ui_dev_url': settings.CLIENT_DEV_URL,
        'development_mode': settings.MODE == "DEVELOPMENT"
    }
