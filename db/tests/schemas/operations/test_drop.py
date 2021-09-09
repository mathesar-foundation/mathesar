import pytest
from sqlalchemy.exc import NoSuchTableError, ProgrammingError
from psycopg2.errors import DependentObjectsStillExist

from db.schemas import operations as schema_operations
from db.schemas.utils import get_mathesar_schemas
from db.tables.operations.create import create_mathesar_table
from db.tables.utils import reflect_table
from db.tests.schemas.utils import create_related_table


@pytest.mark.parametrize("if_exists", [True, False])
def test_drop_schema(engine, if_exists):
    test_schema = "test_drop_schema"

    schema_operations.create_schema(test_schema, engine)
    current_schemas = get_mathesar_schemas(engine)
    assert test_schema in current_schemas

    schema_operations.drop_schema(test_schema, engine, if_exists=if_exists)
    current_schemas = get_mathesar_schemas(engine)
    assert test_schema not in current_schemas


def test_drop_schema_missing_if_exists_true(engine):
    # Just ensure there is no error
    schema_operations.drop_schema("test_drop_schema_missing", engine, if_exists=True)


def test_drop_schema_missing_if_exists_false(engine):
    with pytest.raises(ProgrammingError):
        schema_operations.drop_schema("test_drop_schema_missing", engine, if_exists=False)


def test_drop_schema_restricted(engine):
    test_schema = "test_drop_schema_restricted"
    test_table = "test_drop_schema_restricted_table"

    schema_operations.create_schema(test_schema, engine)
    create_mathesar_table(test_table, test_schema, [], engine)

    with pytest.raises(DependentObjectsStillExist):
        schema_operations.drop_schema(test_schema, engine)

    current_schemas = get_mathesar_schemas(engine)
    assert test_schema in current_schemas


def test_drop_schema_cascade(engine):
    test_schema = "test_drop_schema_cascade"
    test_table = "test_drop_schema_cascade_table"

    schema_operations.create_schema(test_schema, engine)
    table = create_mathesar_table(test_table, test_schema, [], engine)

    schema_operations.drop_schema(test_schema, engine, cascade=True)

    current_schemas = get_mathesar_schemas(engine)
    assert test_schema not in current_schemas
    with pytest.raises(NoSuchTableError):
        reflect_table(table.name, test_schema, engine)


def test_drop_schema_cascade_foreign_key(engine):
    test_schema = "test_drop_schema_cascade_foreign_key"
    related_schema = "test_drop_schema_cascade_foreign_key_related"
    test_table = "test_drop_schema_cascade_foreign_key_table"
    test_related_table = "test_drop_schema_cascade_foreign_key_related_table"

    related_table = create_related_table(
        test_schema, related_schema, test_table, test_related_table, engine
    )

    schema_operations.drop_schema(test_schema, engine, cascade=True)

    related_table = reflect_table(related_table.name, related_schema, engine)
    assert len(related_table.foreign_keys) == 0
