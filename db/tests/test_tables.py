import pytest
from sqlalchemy import text
from db import tables


@pytest.fixture
def engine_with_schema(engine):
    app_schema = "test_schema"
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA {app_schema};"))
    yield engine, app_schema
    with engine.begin() as conn:
        conn.execute(text(f"DROP SCHEMA {app_schema} CASCADE;"))


def test_table_creation_doesnt_reuse_defaults(engine_with_schema):
    columns = []
    engine, schema = engine_with_schema
    t1 = tables.create_mathesar_table("t1", schema, columns, engine)
    t2 = tables.create_mathesar_table("t2", schema, columns, engine)
    assert all(
        [
            c1.name == c2.name and c1 != c2
            for c1, c2 in zip(t1.columns, t2.columns)
        ]
    )
