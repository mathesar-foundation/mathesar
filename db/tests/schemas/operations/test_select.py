import warnings
from sqlalchemy import select, Table, MetaData, text

from db import types
from db.tables.operations import infer_types
from db.schemas.operations import select as ssel


def test_get_mathesar_schemas_with_oids_gets_added_schema(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = ssel.get_mathesar_schemas_with_oids(engine)
    assert schema in [schema for schema, oid in actual_schemas]


def test_get_mathesar_schemas_with_oids_avoids_pg_schemas(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = ssel.get_mathesar_schemas_with_oids(engine)
    assert all([schema[:3] != "pg_" for schema, oid in actual_schemas])


def test_get_mathesar_schemas_with_oids_avoids_information_schema(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = ssel.get_mathesar_schemas_with_oids(engine)
    assert all([schema != "information_schema" for schema, _ in actual_schemas])


def test_get_mathesar_schemas_with_oids_avoids_types_schema(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = ssel.get_mathesar_schemas_with_oids(engine)
    assert all([schema != types.base.SCHEMA for schema, _ in actual_schemas])


def test_get_mathesar_schemas_with_oids_avoids_temp_schema(engine_with_schema):
    engine, schema = engine_with_schema
    actual_schemas = ssel.get_mathesar_schemas_with_oids(engine)
    assert all([schema != infer_types.TEMP_SCHEMA for schema, _ in actual_schemas])


def test_get_mathesar_schemas_with_oids_gets_correct_oid(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_namespace = Table("pg_namespace", metadata, autoload_with=engine)
    sel = select(pg_namespace.c.oid).where(pg_namespace.c.nspname == schema)
    with engine.begin() as conn:
        expect_oid = conn.execute(sel).fetchone()[0]
    actual_schemata = ssel.get_mathesar_schemas_with_oids(engine)
    actual_oid = [oid for schm, oid in actual_schemata if schm == schema][0]
    assert actual_oid == expect_oid


def test_get_schema_description(engine_with_schema):
    engine, schema = engine_with_schema
    schema_oid = ssel.reflect_schema(engine, name=schema)['oid']
    expect_description = 'test schema description'
    with engine.begin() as conn:
        conn.execute(text(f'''COMMENT ON SCHEMA "{schema}" IS '{expect_description}';'''))
    actual_description = ssel.get_schema_description(schema_oid, engine)

    assert actual_description == expect_description
