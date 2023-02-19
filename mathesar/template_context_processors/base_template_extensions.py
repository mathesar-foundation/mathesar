from django.conf import settings


def script_extension_templates(request):
    return {
        "scripts_extension_templates": settings.BASE_TEMPLATE_ADDITIONAL_SCRIPT_TEMPLATES
    }
