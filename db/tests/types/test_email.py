from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text, select, func, Table, Column, MetaData
from sqlalchemy.exc import IntegrityError
from db.engine import _add_custom_types_to_engine
from db.tests.types import fixtures
from db.types import email
from db.utils import execute_query
from db.functions.base import ColumnName, Literal
from db.functions.operations.apply import apply_db_function_as_filter


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
roster_table_obj = fixtures.roster_table_obj
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


def test_domain_func_wrapper(engine_email_type):
    engine, _ = engine_email_type
    sel = select(func.email_domain_name(text("'test@example.com'")))
    with engine.begin() as conn:
        res = conn.execute(sel)
        assert res.fetchone()[0] == "example.com"


def test_local_part_func_wrapper(engine_email_type):
    engine, _ = engine_email_type
    sel = select(func.email_local_part(text("'test@example.com'")))
    with engine.begin() as conn:
        res = conn.execute(sel)
        assert res.fetchone()[0] == "test"


def test_email_type_column_creation(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("email_addresses", email.Email),
        )
        test_table.create()


def test_email_type_column_reflection(engine_email_type):
    engine, app_schema = engine_email_type
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
    engine, _ = engine_email_type
    email_addresses_correct = ["alice@example.com", "alice@example"]
    for address in email_addresses_correct:
        with engine.begin() as conn:
            res = conn.execute(
                text(f"SELECT '{address}'::{email.DB_TYPE};")
            )
            assert res.fetchone()[0] == address


def test_create_email_type_domain_accepts_uppercase(engine_email_type):
    engine, _ = engine_email_type
    email_addresses_correct = ["alice@example.com", "alice@example"]
    for address in email_addresses_correct:
        with engine.begin() as conn:
            res = conn.execute(
                text(f"SELECT '{address}'::{email.DB_TYPE.upper()};")
            )
            assert res.fetchone()[0] == address


def test_create_email_type_domain_checks_broken_emails(engine_email_type):
    engine, _ = engine_email_type
    address_incorrect = "aliceexample.com"
    with pytest.raises(IntegrityError) as e:
        with engine.begin() as conn:
            conn.execute(
                text(
                    f"SELECT '{address_incorrect}'::{email.DB_TYPE};"
                )
            )
        assert type(e.orig) == CheckViolation


@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (email.EmailDomainContains, "mail", 588),
    (email.EmailDomainEquals, "gmail.com", 303),
])
def test_email_db_functions(roster_table_obj, main_db_function, literal_param, expected_count):
    table, engine = roster_table_obj
    selectable = table.select()
    email_column_name = "Teacher Email"
    db_function = main_db_function([
        ColumnName([email_column_name]),
        Literal([literal_param]),
    ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_query(engine, query)
    assert len(record_list) == expected_count
