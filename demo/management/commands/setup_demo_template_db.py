from sqlalchemy import text

from db.install import install_mathesar

from django.conf import settings
from django.core.management import BaseCommand



class Command(BaseCommand):
    help = 'Initialize the demo template database.'

    def handle(self, *args, **options):
        _setup_demo_template_db(*args, **options)

def _setup_demo_template_db():
    print("Initializing demo template database...")
    from demo.install.datasets import load_datasets  # noqa
    from mathesar.database.base import create_mathesar_engine  # noqa

    template_db_name = settings.MATHESAR_DEMO_TEMPLATE
    root_engine = create_mathesar_engine(settings.DATABASES["default"]["NAME"])
    with root_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {template_db_name} WITH (FORCE)"))
    root_engine.dispose()
    install_mathesar(
        database_name=template_db_name,
        username=settings.DATABASES["default"]["USER"],
        password=settings.DATABASES["default"]["PASSWORD"],
        hostname=settings.DATABASES["default"]["HOST"],
        port=settings.DATABASES["default"]["PORT"],
        skip_confirm=True
    )
    user_engine = create_mathesar_engine(template_db_name)
    load_datasets(user_engine)
    user_engine.dispose()
