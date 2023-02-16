from django.conf import settings


def default_scripts(request):
    return {
        "default_scripts_extensions": settings.BASE_TEMPLATE_SCRIPT_EXTENSION_TEMPLATES
    }
