from sqlalchemy import text, MetaData, Table, Column, select
from db.engine import _add_custom_types_to_engine
from db.tests.types import fixtures
from db.types import money

# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


def test_money_type_column_creation(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("money_col", money.Money),
        )
        test_table.create()


def test_money_type_column_reflection(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("sales_amounts", money.Money),
        )
        test_table.create()

    _add_custom_types_to_engine(engine)
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = money.Money
    actual_cls = reflect_table.columns["sales_amounts"].type.__class__
    assert actual_cls == expect_cls


def test_money_type_raw_selecting(engine_email_type):
    engine, _ = engine_email_type
    money_str = '(1234.12,USD)'
    with engine.begin() as conn:
        res = conn.execute(
            text(f"SELECT '{money_str}'::{money.DB_TYPE};")
        )
        assert res.fetchone()[0] == money_str


def test_money_type_insert_from_dict(engine_email_type):
    engine, app_schema = engine_email_type
    metadata = MetaData(bind=engine, schema=app_schema)
    test_table = Table(
        "test_table",
        metadata,
        Column("sales_amounts", money.Money),
    )
    test_table.create()
    ins = test_table.insert().values(
        sales_amounts={money.VALUE: 1234.12, money.CURRENCY: 'EUR'}
    )
    with engine.begin() as conn:
        conn.execute(ins)

    # we use raw select to ensure the tuple is correct in the DB
    with engine.begin() as conn:
        res = conn.execute(
            text(f"SELECT * FROM {app_schema}.{test_table.name};")
        )
        actual_val = res.fetchone()[0]
        expect_val = '(1234.12,EUR)'
        assert actual_val == expect_val


def test_money_type_select_to_dict(engine_email_type):
    engine, app_schema = engine_email_type
    metadata = MetaData(bind=engine, schema=app_schema)
    test_table = Table(
        "test_table",
        metadata,
        Column("sales_amounts", money.Money),
    )
    test_table.create()
    with engine.begin() as conn:
        conn.execute(
            text(f"INSERT INTO {app_schema}.{test_table.name} VALUES ('(11.11,HKD)');")
        )
    sel = select(test_table)
    with engine.begin() as conn:
        res = conn.execute(sel)
        actual_val = res.fetchone()[0]
        expect_val = {money.VALUE: 11.11, money.CURRENCY: 'HKD'}
        assert actual_val == expect_val
