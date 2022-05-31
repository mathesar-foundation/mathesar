from sqlalchemy import text, MetaData, Table, Column
from db.types.custom import money


def test_money_type_column_creation(engine_with_schema):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("money_col", money.MathesarMoney),
        )
        test_table.create()


def test_money_type_column_reflection(engine_with_schema):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("money_col", money.MathesarMoney),
        )
        test_table.create()

    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = money.MathesarMoney
    actual_cls = reflect_table.columns["money_col"].type.__class__
    assert actual_cls == expect_cls
