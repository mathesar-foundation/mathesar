import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import ProgrammingError

from db.schemas import utils as schema_utils
from db.schemas.operations.alter import comment_on_schema, rename_schema
from db.schemas.operations.create import create_schema
from db.schemas.operations.select import reflect_schema
from db.tables.operations.select import reflect_table
from db.tests.schemas.utils import create_related_table


def test_rename_schema(engine):
    test_schema = "test_rename_schema"
    new_test_schema = "test_rename_schema_new"

    create_schema(test_schema, engine)
    current_schemas = schema_utils.get_mathesar_schemas(engine)
    assert test_schema in current_schemas

    rename_schema(test_schema, engine, new_test_schema)
    current_schemas = schema_utils.get_mathesar_schemas(engine)
    assert test_schema not in current_schemas
    assert new_test_schema in current_schemas


def test_rename_schema_missing(engine):
    with pytest.raises(ProgrammingError):
        rename_schema("test_rename_schema_missing", engine, "new_name")


def test_comment_on_schema(engine_with_schema):
    engine, schema = engine_with_schema
    schema_oid = reflect_schema(engine, name=schema)['oid']

    expect_comment = 'test comment'
    comment_on_schema(schema, engine, expect_comment)
    with engine.begin() as conn:
        res = conn.execute(select(func.obj_description(schema_oid, 'pg_namespace')))
    actual_comment = res.fetchone()[0]

    assert actual_comment == expect_comment

    expect_new_comment = 'test comment new'
    comment_on_schema(schema, engine, expect_new_comment)
    with engine.begin() as conn:
        res = conn.execute(select(func.obj_description(schema_oid, 'pg_namespace')))
    actual_new_comment = res.fetchone()[0]

    assert actual_new_comment == expect_new_comment

def test_rename_schema_foreign_key(engine):
    test_schema = "test_rename_schema_foreign_key"
    related_schema = "test_rename_schema_foreign_key_related"
    new_test_schema = "test_rename_schema_foreign_key_new"
    test_table = "test_rename_schema_foreign_key_table"
    test_related_table = "test_rename_schema_foreign_key_related_table"

    related_table = create_related_table(
        test_schema, related_schema, test_table, test_related_table, engine
    )

    rename_schema(test_schema, engine, new_test_schema)

    related_table = reflect_table(related_table.name, related_schema, engine)
    fk = list(related_table.foreign_keys)[0]
    assert fk.column.table.schema == new_test_schema
