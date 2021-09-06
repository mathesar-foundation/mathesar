import pytest
import warnings
from unittest.mock import patch
from sqlalchemy import (
    create_engine, select, Table, MetaData, ForeignKey, Column, Integer
)
from sqlalchemy.exc import NoSuchTableError, ProgrammingError
from psycopg2.errors import DependentObjectsStillExist

from db import schemas, types, constants
from db.tables.ddl.create import create_mathesar_table
from db.tables.utils import reflect_table


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
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_namespace = Table("pg_namespace", metadata, autoload_with=engine)
    sel = select(pg_namespace.c.oid).where(pg_namespace.c.nspname == schema)
    with engine.begin() as conn:
        expect_oid = conn.execute(sel).fetchone()[0]
    actual_schemata = schemas.get_mathesar_schemas_with_oids(engine)
    actual_oid = [oid for schm, oid in actual_schemata if schm == schema][0]
    assert actual_oid == expect_oid


def _create_related_table(schema, related_schema, table, related_table, engine):
    schemas.create_schema(schema, engine)
    table = create_mathesar_table(table, schema, [], engine)

    schemas.create_schema(related_schema, engine)
    metadata = MetaData(schema=related_schema, bind=engine)
    related_table = Table(
        related_table, metadata,
        Column('id', Integer, ForeignKey(table.c[constants.ID]))
    )
    related_table.create()

    related_table = reflect_table(related_table.name, related_schema, engine)
    fk = list(related_table.foreign_keys)[0]
    assert fk.column.table.schema == schema

    return related_table


@pytest.mark.parametrize("if_exists", [True, False])
def test_delete_schema(engine, if_exists):
    test_schema = "test_delete_schema"

    schemas.create_schema(test_schema, engine)
    current_schemas = schemas.get_mathesar_schemas(engine)
    assert test_schema in current_schemas

    schemas.delete_schema(test_schema, engine, if_exists=if_exists)
    current_schemas = schemas.get_mathesar_schemas(engine)
    assert test_schema not in current_schemas


def test_delete_schema_missing_if_exists_true(engine):
    # Just ensure there is no error
    schemas.delete_schema("test_delete_schema_missing", engine, if_exists=True)


def test_delete_schema_missing_if_exists_false(engine):
    with pytest.raises(ProgrammingError):
        schemas.delete_schema("test_delete_schema_missing", engine, if_exists=False)


def test_delete_schema_restricted(engine):
    test_schema = "test_delete_schema_restricted"
    test_table = "test_delete_schema_restricted_table"

    schemas.create_schema(test_schema, engine)
    create_mathesar_table(test_table, test_schema, [], engine)

    with pytest.raises(DependentObjectsStillExist):
        schemas.delete_schema(test_schema, engine)

    current_schemas = schemas.get_mathesar_schemas(engine)
    assert test_schema in current_schemas


def test_delete_schema_cascade(engine):
    test_schema = "test_delete_schema_cascade"
    test_table = "test_delete_schema_cascade_table"

    schemas.create_schema(test_schema, engine)
    table = create_mathesar_table(test_table, test_schema, [], engine)

    schemas.delete_schema(test_schema, engine, cascade=True)

    current_schemas = schemas.get_mathesar_schemas(engine)
    assert test_schema not in current_schemas
    with pytest.raises(NoSuchTableError):
        reflect_table(table.name, test_schema, engine)


def test_delete_schema_cascade_foreign_key(engine):
    test_schema = "test_delete_schema_cascade_foreign_key"
    related_schema = "test_delete_schema_cascade_foreign_key_related"
    test_table = "test_delete_schema_cascade_foreign_key_table"
    test_related_table = "test_delete_schema_cascade_foreign_key_related_table"

    related_table = _create_related_table(
        test_schema, related_schema, test_table, test_related_table, engine
    )

    schemas.delete_schema(test_schema, engine, cascade=True)

    related_table = reflect_table(related_table.name, related_schema, engine)
    assert len(related_table.foreign_keys) == 0


def test_rename_schema(engine):
    test_schema = "test_rename_schema"
    new_test_schema = "test_rename_schema_new"

    schemas.create_schema(test_schema, engine)
    current_schemas = schemas.get_mathesar_schemas(engine)
    assert test_schema in current_schemas

    schemas.rename_schema(test_schema, engine, new_test_schema)
    current_schemas = schemas.get_mathesar_schemas(engine)
    assert test_schema not in current_schemas
    assert new_test_schema in current_schemas


def test_rename_schema_missing(engine):
    with pytest.raises(ProgrammingError):
        schemas.rename_schema("test_rename_schema_missing", engine, "new_name")


def test_rename_schema_foreign_key(engine):
    test_schema = "test_rename_schema_foreign_key"
    related_schema = "test_rename_schema_foreign_key_related"
    new_test_schema = "test_rename_schema_foreign_key_new"
    test_table = "test_rename_schema_foreign_key_table"
    test_related_table = "test_rename_schema_foreign_key_related_table"

    related_table = _create_related_table(
        test_schema, related_schema, test_table, test_related_table, engine
    )

    schemas.rename_schema(test_schema, engine, new_test_schema)

    related_table = reflect_table(related_table.name, related_schema, engine)
    fk = list(related_table.foreign_keys)[0]
    assert fk.column.table.schema == new_test_schema
