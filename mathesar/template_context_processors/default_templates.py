from django.conf import settings


def default_scripts(request):
    return {
        "scripts_extension_templates": settings.BASE_TEMPLATE_ADDITIONAL_SCRIPT_TEMPLATES
    }
