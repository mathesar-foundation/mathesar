from django.conf import settings
import pytest
from sqlalchemy import text
from mathesar.database.base import create_engine_with_custom_types
from mathesar.database.types import install
from mathesar.database.types import constants


@pytest.fixture
def engine():
    return create_engine_with_custom_types(
        username=settings.DATABASES["default"]["USER"],
        password=settings.DATABASES["default"]["PASSWORD"],
        hostname=settings.DATABASES["default"]["HOST"],
        database=settings.DATABASES["default"]["NAME"],
        future=True,
    )


@pytest.mark.django_db
def test_create_type_schema(engine):
    install.create_type_schema(engine)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT * FROM information_schema.schemata"))
    schemata = {row['schema_name'] for row in res.fetchall()}
    assert constants.TYPE_SCHEMA in schemata


@pytest.mark.django_db
def test_create_type_schema_when_exists(engine):
    # This just checks that the function doesn't error if the type schema
    # already exists when it's run.
    install.create_type_schema(engine)
    install.create_type_schema(engine)
