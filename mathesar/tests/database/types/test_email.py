from django.conf import settings
import pytest
from sqlalchemy import text
from mathesar.database.base import create_engine_with_custom_types
from mathesar.database.types import install
from mathesar.database.types import email


@pytest.fixture
def engine():
    return create_engine_with_custom_types(
        "postgresql://{username}:{password}@{hostname}/{database}".format(
            username=settings.DATABASES["default"]["USER"],
            password=settings.DATABASES["default"]["PASSWORD"],
            hostname=settings.DATABASES["default"]["HOST"],
            database=settings.DATABASES["default"]["NAME"],
        ),
        future=True,
    )


@pytest.fixture
def type_schema(engine):
    install.create_type_schema(engine)


@pytest.mark.django_db
def test_create_email_type_creates_pg_domain(engine, type_schema):
    email_address = 'alice@example.com'
    email.create_email_type(engine)
    with engine.connect() as conn:
        res = conn.execute(
            text(f"SELECT '{email_address}'::{email.QUALIFIED_EMAIL};")
        )
    assert res.fetchone()[0] == 'alice@example.com'
