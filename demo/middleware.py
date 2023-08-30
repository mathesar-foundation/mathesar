"""This module adds a middleware for the Live Demo."""
import logging

from django.conf import settings

from demo.db_namer import get_name
from demo.utils import set_live_demo_db_name
from demo.install.arxiv_skeleton import append_db_and_arxiv_schema_to_log
from demo.install.base import ARXIV, create_demo_database
from demo.install.custom_settings import customize_settings
from demo.install.explorations import load_custom_explorations
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
                database["USER"],
                database["PASSWORD"],
                database["HOST"],
                database["NAME"],
                database["PORT"],
                settings.MATHESAR_DEMO_TEMPLATE
            )
            append_db_and_arxiv_schema_to_log(db_name, ARXIV)
            reset_reflection(db_name=db_name)
            engine = create_mathesar_engine(database)
            customize_settings(engine)
            load_custom_explorations(engine)
            engine.dispose()

        logger.debug(f"Using database {db_name} for sessionid {sessionid}")
        request = set_live_demo_db_name(request, db_name)

        response = self.get_response(request)
        return response
