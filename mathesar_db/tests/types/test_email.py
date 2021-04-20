from django.conf import settings
from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text, select, func, Table, Column, MetaData
from sqlalchemy.exc import IntegrityError
from mathesar_db.types import install
from mathesar_db.types import email


@pytest.fixture
def engine_type_schema(engine):
    install.create_type_schema(engine)
    yield engine
    with engine.begin() as conn:
        conn.execute(
            text(f"DROP SCHEMA IF EXISTS {install.base.SCHEMA} CASCADE;")
        )


@pytest.fixture
def engine_email_type(engine_type_schema):
    email.create_email_type(engine_type_schema)
    return engine_type_schema


@pytest.fixture
def engine_with_app(engine_email_type):
    app_schema = "test_app"
    with engine_email_type.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA {app_schema};"))
    yield engine_email_type, app_schema
    with engine_email_type.begin() as conn:
        conn.execute(text(f"DROP SCHEMA {app_schema} CASCADE;"))


def test_domain_func_wrapper(engine_email_type):
    sel = select(func.email_domain_name(text("'test@example.com'")))
    with engine_email_type.begin() as conn:
        res = conn.execute(sel)
        assert res.fetchone()[0] == "example.com"


def test_local_part_func_wrapper(engine_email_type):
    sel = select(func.email_local_part(text("'test@example.com'")))
    with engine_email_type.begin() as conn:
        res = conn.execute(sel)
        assert res.fetchone()[0] == "test"


def test_email_type_column_creation(engine_with_app):
    engine, app_schema = engine_with_app
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("email_addresses", email.Email),
        )
        test_table.create()


def test_email_type_column_reflection(engine_with_app):
    engine, app_schema = engine_with_app
    with engine.begin() as conn:
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("email_addresses", email.Email),
        )
        test_table.create()

    with engine.begin() as conn:
        metadata = MetaData(bind=conn)
        reflect_table = Table("test_table", metadata, autoload_with=conn)

    expect_cls = email.Email
    actual_cls = reflect_table.columns["email_addresses"].type.__class__
    assert actual_cls == expect_cls


def test_create_email_type_domain_passes_correct_emails(engine_email_type):
    email_addresses_correct = ["alice@example.com", "alice@example"]
    for address in email_addresses_correct:
        with engine_email_type.begin() as conn:
            res = conn.execute(
                text(f"SELECT '{address}'::{email.QUALIFIED_EMAIL};")
            )
            assert res.fetchone()[0] == address


def test_create_email_type_domain_checks_broken_emails(engine_email_type):
    address_incorrect = "aliceexample.com"
    with pytest.raises(IntegrityError) as e:
        with engine_email_type.begin() as conn:
            conn.execute(
                text(
                    f"SELECT '{address_incorrect}'::{email.QUALIFIED_EMAIL};"
                )
            )
        assert type(e.orig) == CheckViolation
