from django.conf import settings
from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
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
def engine_type_schema(engine):
    install.create_type_schema(engine)
    yield engine
    with engine.begin() as conn:
        conn.execute(
            text(f"DROP SCHEMA IF EXISTS {install.c.TYPE_SCHEMA} CASCADE;")
        )


@pytest.fixture
def engine_email_type(engine_type_schema):
    email.create_email_type(engine_type_schema)
    return engine_type_schema


@pytest.mark.django_db
def test_create_email_type_domain_passes_correct_emails(engine_email_type):
    email_addresses_correct = ['alice@example.com', 'alice@example']
    for address in email_addresses_correct:
        with engine_email_type.begin() as conn:
            res = conn.execute(
                text(f"SELECT '{address}'::{email.QUALIFIED_EMAIL};")
            )
            assert res.fetchone()[0] == address


@pytest.mark.django_db
def test_create_email_type_domain_checks_broken_emails(engine_email_type):
    address_incorrect = 'aliceexample.com'
    with engine_email_type.begin() as conn:
        with pytest.raises(IntegrityError) as e:
            res = conn.execute(
                text(
                    f"SELECT '{address_incorrect}'::{email.QUALIFIED_EMAIL};"
                )
            )
            assert type(e.orig) == CheckViolation
