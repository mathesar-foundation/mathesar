from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text, select, func, Table, Column, MetaData
from sqlalchemy.exc import IntegrityError
from db.engine import _add_custom_types_to_engine
from db.tests.types import fixtures
from db.types import email


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


def test_domain_func_wrapper(engine_email_type):
    engine = engine_email_type
    sel = select(func.email_domain_name(text("'test@example.com'")))
    with engine.begin() as conn:
        res = conn.execute(sel)
        assert res.fetchone()[0] == "example.com"


def test_local_part_func_wrapper(engine_email_type):
    engine = engine_email_type
    sel = select(func.email_local_part(text("'test@example.com'")))
    with engine.begin() as conn:
        res = conn.execute(sel)
        assert res.fetchone()[0] == "test"


def test_email_type_column_creation(engine_email_type, temporary_testing_schema):
    engine, app_schema = engine_email_type, temporary_testing_schema
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("email_addresses", email.Email),
        )
        test_table.create()


def test_email_type_column_reflection(engine_email_type, temporary_testing_schema):
    engine, app_schema = engine_email_type, temporary_testing_schema
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("email_addresses", email.Email),
        )
        test_table.create()

    _add_custom_types_to_engine(engine)
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = email.Email
    actual_cls = reflect_table.columns["email_addresses"].type.__class__
    assert actual_cls == expect_cls


def test_create_email_type_domain_passes_correct_emails(engine_email_type):
    engine = engine_email_type
    email_addresses_correct = ["alice@example.com", "alice@example"]
    for address in email_addresses_correct:
        with engine.begin() as conn:
            res = conn.execute(
                text(f"SELECT '{address}'::{email.DB_TYPE};")
            )
            assert res.fetchone()[0] == address


def test_create_email_type_domain_accepts_uppercase(engine_email_type):
    engine = engine_email_type
    email_addresses_correct = ["alice@example.com", "alice@example"]
    for address in email_addresses_correct:
        with engine.begin() as conn:
            res = conn.execute(
                text(f"SELECT '{address}'::{email.DB_TYPE.upper()};")
            )
            assert res.fetchone()[0] == address


def test_create_email_type_domain_checks_broken_emails(engine_email_type):
    engine = engine_email_type
    address_incorrect = "aliceexample.com"
    with pytest.raises(IntegrityError) as e:
        with engine.begin() as conn:
            conn.execute(
                text(
                    f"SELECT '{address_incorrect}'::{email.DB_TYPE};"
                )
            )
        assert type(e.orig) == CheckViolation
