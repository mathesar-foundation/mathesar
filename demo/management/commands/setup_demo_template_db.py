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
    print("Initializing demo template database...")

    template_db_name = settings.MATHESAR_DEMO_TEMPLATE
    django_model = Database.current_objects.get(name=settings.DATABASES["default"]["NAME"])
    root_engine = create_mathesar_engine(django_model)
    with root_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {template_db_name} WITH (FORCE)"))
    root_engine.dispose()
    db_model, _ = Database.current_objects.get_or_create(
        name=template_db_name,
        defaults={
            'db_username': django_model.db_username,
            'db_password': django_model.db_password,
            'db_host': django_model.db_host,
            'db_port': django_model.db_port
        }
    )
    install_mathesar(
        name=template_db_name,
        db_username=db_model.db_username,
        db_password=db_model.db_password,
        db_host=db_model.db_host,
        db_port=db_model.db_port,
        skip_confirm=True
    )
    user_engine = create_mathesar_engine(db_model)
    load_datasets(user_engine)
    user_engine.dispose()
