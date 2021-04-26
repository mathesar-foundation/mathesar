from sqlalchemy import create_engine
from db import schemas
from db import types


def test_get_mathesar_schemas_gets_public(monkeypatch):
    engine = create_engine("postgresql://")
    monkeypatch.setattr(
        schemas,
        "get_all_schemas",
        lambda x: ["public"]
    )
    actual_schemas = schemas.get_mathesar_schemas(engine)
    expect_schemas = ["public"]
    assert actual_schemas == expect_schemas
