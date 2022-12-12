from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text, select, Table, Column, MetaData
from sqlalchemy.exc import IntegrityError
from db.types.custom import email
from db.types.base import PostgresType
from db.utils import execute_pg_query
from db.functions.base import ColumnName, Literal, sa_call_sql_function
from db.functions.packed import EmailDomainContains, EmailDomainEquals
from db.functions.operations.apply import apply_db_function_as_filter


def test_domain_func_wrapper(engine_with_schema):
    engine, _ = engine_with_schema
    sel = select(
        sa_call_sql_function(
            email.EMAIL_DOMAIN_NAME,
            text("'test@example.com'"),
            return_type=PostgresType.TEXT
        )
    )
    with engine.begin() as conn:
        res = conn.execute(sel)
        assert res.fetchone()[0] == "example.com"


def test_local_part_func_wrapper(engine_with_schema):
    engine, _ = engine_with_schema
    sel = select(
        sa_call_sql_function(
            email.EMAIL_LOCAL_PART,
            text("'test@example.com'"),
            return_type=PostgresType.TEXT
        )
    )
    with engine.begin() as conn:
        res = conn.execute(sel)
        assert res.fetchone()[0] == "test"


def test_email_type_column_creation(engine_with_schema):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("email_addresses", email.Email),
        )
        test_table.create()


def test_email_type_column_reflection(engine_with_schema):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("email_addresses", email.Email),
        )
        test_table.create()
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = email.Email
    actual_cls = reflect_table.columns["email_addresses"].type.__class__
    assert actual_cls == expect_cls


def test_create_email_type_domain_passes_correct_emails(engine_with_schema):
    engine, _ = engine_with_schema
    email_addresses_correct = ["alice@example.com", "alice@example"]
    for address in email_addresses_correct:
        with engine.begin() as conn:
            res = conn.execute(
                text(f"SELECT '{address}'::{email.DB_TYPE};")
            )
            assert res.fetchone()[0] == address


def test_create_email_type_domain_accepts_uppercase(engine_with_schema):
    engine, _ = engine_with_schema
    email_addresses_correct = ["alice@example.com", "alice@example"]
    for address in email_addresses_correct:
        with engine.begin() as conn:
            res = conn.execute(
                text(f"SELECT '{address}'::{email.DB_TYPE.upper()};")
            )
            assert res.fetchone()[0] == address


def test_create_email_type_domain_checks_broken_emails(engine_with_schema):
    engine, _ = engine_with_schema
    address_incorrect = "aliceexample.com"
    with pytest.raises(IntegrityError) as e:
        with engine.begin() as conn:
            conn.execute(
                text(
                    f"SELECT '{address_incorrect}'::{email.DB_TYPE};"
                )
            )
        assert type(e.orig) == CheckViolation

def test_create_email_type_domain_returns_correct_error_broken_emails(engine_with_schema):  
    engine, _ = engine_with_schema
    address_incorrect = "notanemailaddress"  
    with pytest.raises(IntegrityError) as e:
        with engine.begin() as conn:
            conn.execute(
                text(
                    f"SELECT '{address_incorrect}'::{email.DB_TYPE};"
                )
            )
        assert type(e.orig) == CheckViolation
        assert address_incorrect + "is not a valid email address" in str(e.value)



@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (EmailDomainContains, "mail", 588),
    (EmailDomainEquals, "gmail.com", 303),
    (EmailDomainContains, "krista", 0),
    (EmailDomainEquals, "kristaramirez@yahoo.com", 0),
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
    record_list = execute_pg_query(engine, query)
    assert len(record_list) == expected_count
