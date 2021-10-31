from psycopg2.errors import DependentObjectsStillExist
import pytest
from sqlalchemy.exc import NoSuchTableError

from db.tables.operations.select import reflect_table
from db.tables.operations.create import create_mathesar_table
from db.tables.operations.drop import drop_table
from db.tests.tables import utils as test_utils


@pytest.mark.parametrize("if_exists", [True, False])
def test_drop_table(engine_with_schema, if_exists):
    engine, schema = engine_with_schema
    table_name = "test_drop_table"
    create_mathesar_table(table_name, schema, [], engine)
    drop_table(table_name, schema, engine, if_exists=if_exists)
    with pytest.raises(NoSuchTableError):
        reflect_table(table_name, schema, engine)


def test_drop_table_no_table_if_exists_true(engine_with_schema):
    engine, schema = engine_with_schema
    # Just confirm we don't thrown an error
    drop_table("test_drop_table", schema, engine, if_exists=True)


def test_drop_table_no_table_if_exists_false(engine_with_schema):
    engine, schema = engine_with_schema
    with pytest.raises(NoSuchTableError):
        drop_table("test_drop_table", schema, engine, if_exists=False)


def test_drop_table_restricted_foreign_key(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "test_drop_table_restricted_foreign_key"
    related_table_name = "test_drop_table_restricted_foreign_key_related"

    table = create_mathesar_table(table_name, schema, [], engine)
    test_utils.create_related_table(related_table_name, table, schema, engine)

    with pytest.raises(DependentObjectsStillExist):
        drop_table(table_name, schema, engine, cascade=False)


def test_drop_table_cascade_foreign_key(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "test_drop_table_cascade_foreign_key"
    related_table_name = "test_drop_table_cascade_foreign_key_related"

    table = create_mathesar_table(table_name, schema, [], engine)
    related_table = test_utils.create_related_table(related_table_name, table, schema, engine)

    drop_table(table_name, schema, engine, cascade=True)

    related_table = reflect_table(related_table.name, schema, engine)
    assert len(related_table.foreign_keys) == 0
