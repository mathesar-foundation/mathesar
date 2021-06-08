from unittest.mock import patch
from sqlalchemy import create_engine, select, Table, MetaData
from db import schemas
from db import types


def test_get_mathesar_schemas():
    engine = create_engine("postgresql://")
    with patch.object(schemas, "get_mathesar_schemas_with_oids") as mock_schemas:
        schemas.get_mathesar_schemas(engine)
    mock_schemas.assert_called_once_with(engine)


def test_get_mathesar_schemas_with_oids_gets_added_schema(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = schemas.get_mathesar_schemas_with_oids(engine)
    assert schema in [schema for schema, oid in actual_schemas]


def test_get_mathesar_schemas_with_oids_avoids_pg_schemas(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = schemas.get_mathesar_schemas_with_oids(engine)
    assert all([schema[:3] != "pg_" for schema, oid in actual_schemas])


def test_get_mathesar_schemas_with_oids_avoids_information_schema(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = schemas.get_mathesar_schemas_with_oids(engine)
    assert all([schema != "information_schema" for schema, oid in actual_schemas])


def test_get_mathesar_schemas_with_oids_avoids_types_schema(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = schemas.get_mathesar_schemas_with_oids(engine)
    assert all([schema != types.base.SCHEMA for schema, oid in actual_schemas])


def test_get_mathesar_schemas_with_oids_gets_correct_oid(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData()
    pg_namespace = Table("pg_namespace", metadata, autoload_with=engine)
    sel = select(pg_namespace.c.oid).where(pg_namespace.c.nspname == schema)
    with engine.begin() as conn:
        expect_oid = conn.execute(sel).fetchone()[0]
    actual_schemata = schemas.get_mathesar_schemas_with_oids(engine)
    actual_oid = [oid for schm, oid in actual_schemata if schm == schema][0]
    assert actual_oid == expect_oid
