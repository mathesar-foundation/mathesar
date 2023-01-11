"""This module adds a middleware for the Live Demo."""
import logging

from django.conf import settings

from demo.db_namer import get_name
from db.install import create_mathesar_database
from mathesar.models.base import Database

logger = logging.getLogger(__name__)


class LiveDemoModeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        sessionid = request.COOKIES.get('sessionid', None)
        # every 4th character obfuscates sessionid (a bit)
        db_name = get_name(str(sessionid))
        database, created = Database.current_objects.get_or_create(name=db_name)
        if created:
            create_mathesar_database(
                db_name,
                username=settings.DATABASES["default"]["USER"],
                password=settings.DATABASES["default"]["PASSWORD"],
                hostname=settings.DATABASES["default"]["HOST"],
                root_database=settings.DATABASES["default"]["NAME"],
                port=settings.DATABASES["default"]["PORT"],
            )

        logger.debug(f"Using database {db_name} for sessionid {sessionid}")
        params = request.GET.copy()
        params.update({'database': db_name})
        request.GET = params

        response = self.get_response(request)
        return response
