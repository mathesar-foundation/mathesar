import pytest
from sqlalchemy.exc import NoSuchTableError, ProgrammingError
from psycopg2.errors import DependentObjectsStillExist

from db.schemas.operations.create import create_schema
from db.schemas.operations.drop import drop_schema
from db.schemas.utils import get_mathesar_schemas
from db.tables.operations.create import create_mathesar_table
from db.tables.operations.select import reflect_table
from db.tests.schemas.utils import create_related_table
from db.metadata import get_empty_metadata


@pytest.mark.parametrize("if_exists", [True, False])
def test_drop_schema(engine, if_exists):
    test_schema = "test_drop_schema"

    create_schema(test_schema, engine)
    current_schemas = get_mathesar_schemas(engine)
    assert test_schema in current_schemas

    drop_schema(test_schema, engine, if_exists=if_exists)
    current_schemas = get_mathesar_schemas(engine)
    assert test_schema not in current_schemas


def test_drop_schema_missing_if_exists_true(engine):
    # Just ensure there is no error
    drop_schema("test_drop_schema_missing", engine, if_exists=True)


def test_drop_schema_missing_if_exists_false(engine):
    with pytest.raises(ProgrammingError):
        drop_schema("test_drop_schema_missing", engine, if_exists=False)


def test_drop_schema_restricted(engine):
    test_schema = "test_drop_schema_restricted"
    test_table = "test_drop_schema_restricted_table"

    create_schema(test_schema, engine)
    create_mathesar_table(test_table, test_schema, [], engine)

    with pytest.raises(DependentObjectsStillExist):
        drop_schema(test_schema, engine)

    current_schemas = get_mathesar_schemas(engine)
    assert test_schema in current_schemas


def test_drop_schema_cascade(engine):
    test_schema = "test_drop_schema_cascade"
    test_table = "test_drop_schema_cascade_table"

    create_schema(test_schema, engine)
    table = create_mathesar_table(test_table, test_schema, [], engine)

    drop_schema(test_schema, engine, cascade=True)

    current_schemas = get_mathesar_schemas(engine)
    assert test_schema not in current_schemas
    with pytest.raises(NoSuchTableError):
        reflect_table(table.name, test_schema, engine, metadata=get_empty_metadata())


def test_drop_schema_cascade_foreign_key(engine):
    test_schema = "test_drop_schema_cascade_foreign_key"
    related_schema = "test_drop_schema_cascade_foreign_key_related"
    test_table = "test_drop_schema_cascade_foreign_key_table"
    test_related_table = "test_drop_schema_cascade_foreign_key_related_table"

    related_table = create_related_table(
        test_schema, related_schema, test_table, test_related_table, engine
    )

    drop_schema(test_schema, engine, cascade=True)

    related_table = reflect_table(related_table.name, related_schema, engine, metadata=get_empty_metadata())
    assert len(related_table.foreign_keys) == 0
