from django.apps import AppConfig
from django.conf import settings
from sqlalchemy import text


TEMPLATE_INITIALIZED = 'TEMPLATE_INITIALIZED'


def _initialize_template():
    print("Initializing demo template...")
    from db.install import create_mathesar_database  # noqa
    from demo.install import load_datasets  # noqa
    from mathesar.database.base import create_mathesar_engine  # noqa

    template_db_name = settings.MATHESAR_DEMO_TEMPLATE
    root_engine = create_mathesar_engine(settings.DATABASES["default"]["NAME"])
    with root_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {template_db_name} WITH (FORCE)"))
    root_engine.dispose()
    create_mathesar_database(
        template_db_name,
        username=settings.DATABASES["default"]["USER"],
        password=settings.DATABASES["default"]["PASSWORD"],
        hostname=settings.DATABASES["default"]["HOST"],
        root_database=settings.DATABASES["default"]["NAME"],
        port=settings.DATABASES["default"]["PORT"],
    )
    user_engine = create_mathesar_engine(template_db_name)
    load_datasets(user_engine)
    user_engine.dispose()


class DemoConfig(AppConfig):
    """Initialization manager."""

    name = "demo"

    def ready(self):
        """Perform initialization tasks."""
        _initialize_template()
