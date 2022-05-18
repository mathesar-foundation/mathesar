from sqlalchemy import text, MetaData, Table, Column
from db.tests.types import fixtures
from db.types import mathesar_name

# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


def test_mathesar_name_type_column_creation(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("char_col", mathesar_name.MATHESAR_NAME),
        )
        test_table.create()


def test_mathesar_name_type_column_reflection(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("char_col", mathesar_name.MATHESAR_NAME),
        )
        test_table.create()

    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = mathesar_name.MATHESAR_NAME
    actual_cls = reflect_table.columns["char_col"].type.__class__
    assert actual_cls == expect_cls
