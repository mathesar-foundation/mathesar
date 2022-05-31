from sqlalchemy import text, MetaData, Table, Column
from db.types.custom import char


def test_char_type_column_creation(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("char_col", char.CHAR),
        )
        test_table.create()


def test_char_type_column_reflection(engine_with_schema):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("char_col", char.CHAR),
        )
        test_table.create()

    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = char.CHAR
    actual_cls = reflect_table.columns["char_col"].type.__class__
    assert actual_cls == expect_cls
