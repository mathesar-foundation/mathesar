"""This module adds a middleware for the Live Demo."""
import logging

from django.conf import settings

from demo.arxiv_dataset.base import append_db_and_arxiv_schema_to_log
from demo.install import customize_settings, create_demo_database, ARXIV
from demo.db_namer import get_name
from mathesar.database.base import create_mathesar_engine
from mathesar.models.base import Database
from mathesar.state import reset_reflection


logger = logging.getLogger(__name__)


class LiveDemoModeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        sessionid = request.COOKIES.get('sessionid', None)
        db_name = get_name(str(sessionid))
        database, created = Database.current_objects.get_or_create(name=db_name)
        if created:
            create_demo_database(
                db_name,
                settings.DATABASES["default"]["USER"],
                settings.DATABASES["default"]["PASSWORD"],
                settings.DATABASES["default"]["HOST"],
                settings.DATABASES["default"]["NAME"],
                settings.DATABASES["default"]["PORT"],
                settings.MATHESAR_DEMO_TEMPLATE
            )
            append_db_and_arxiv_schema_to_log(db_name, ARXIV)
            reset_reflection(db_name=db_name)
            engine = create_mathesar_engine(db_name)
            customize_settings(engine)

        logger.debug(f"Using database {db_name} for sessionid {sessionid}")
        params = request.GET.copy()
        params.update({'database': db_name})
        request.GET = params

        response = self.get_response(request)
        return response
