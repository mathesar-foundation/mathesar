from sqlalchemy import text

from django.conf import settings
from django.core.management import BaseCommand

from db.install import install_mathesar
from demo.install.datasets import load_datasets
from mathesar.database.base import create_mathesar_engine
from mathesar.models.base import Database


class Command(BaseCommand):
    help = 'Initialize the demo template database.'

    def handle(self, *args, **options):
        _setup_demo_template_db()


def _setup_demo_template_db():
    """
    Uses the Django default database to execute a forced drop on the template
    database (if it exists), then creates the template database, installs
    Mathesar on it, and loads the datasets on it.
    """
    print("Initializing demo template database...")
    template_db_name = settings.MATHESAR_DEMO_TEMPLATE
    root_db_model = _get_root_db_model()
    root_engine = root_db_model._sa_engine
    _force_drop_if_exists_template_db(
        root_engine=root_engine,
        template_db_name=template_db_name,
    )
    root_engine.dispose()
    template_db_model = _create_and_install_template_db(
        template_db_name=template_db_name,
        root_db_model=root_db_model,
    )
    template_engine = template_db_model._sa_engine
    load_datasets(template_engine)
    template_engine.dispose()


def _get_root_db_model():
    name_of_default_db = settings.DATABASES["default"]["NAME"]
    root_db_model = Database.current_objects.get(name=name_of_default_db)
    return root_db_model


def _force_drop_if_exists_template_db(root_engine, template_db_name):
    with root_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {template_db_name} WITH (FORCE)"))


def _create_and_install_template_db(template_db_name, root_db_model):
    # TODO make cleaner by using Database.create_from_credentials
    template_db_model, _ = Database.current_objects.get_or_create(
        name=template_db_name,
        defaults={
            'db_name': template_db_name,
            'username': root_db_model.username,
            'password': root_db_model.password,
            'host': root_db_model.host,
            'port': root_db_model.port
        }
    )
    # NOTE install_mathesar creates the database if it doesn't exist
    install_mathesar(
        credentials=template_db_model.credentials,
        skip_confirm=True
    )
    return template_db_model
