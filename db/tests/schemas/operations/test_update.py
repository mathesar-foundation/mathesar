import pytest
from sqlalchemy.exc import ProgrammingError

from db.schemas import operations as schema_operations
from db.schemas import utils as schema_utils
from db.tables.utils import reflect_table
from db.tests.schemas.utils import create_related_table


def test_rename_schema(engine):
    test_schema = "test_rename_schema"
    new_test_schema = "test_rename_schema_new"

    schema_operations.create_schema(test_schema, engine)
    current_schemas = schema_utils.get_mathesar_schemas(engine)
    assert test_schema in current_schemas

    schema_operations.rename_schema(test_schema, engine, new_test_schema)
    current_schemas = schema_utils.get_mathesar_schemas(engine)
    assert test_schema not in current_schemas
    assert new_test_schema in current_schemas


def test_rename_schema_missing(engine):
    with pytest.raises(ProgrammingError):
        schema_operations.rename_schema("test_rename_schema_missing", engine, "new_name")


def test_rename_schema_foreign_key(engine):
    test_schema = "test_rename_schema_foreign_key"
    related_schema = "test_rename_schema_foreign_key_related"
    new_test_schema = "test_rename_schema_foreign_key_new"
    test_table = "test_rename_schema_foreign_key_table"
    test_related_table = "test_rename_schema_foreign_key_related_table"

    related_table = create_related_table(
        test_schema, related_schema, test_table, test_related_table, engine
    )

    schema_operations.rename_schema(test_schema, engine, new_test_schema)

    related_table = reflect_table(related_table.name, related_schema, engine)
    fk = list(related_table.foreign_keys)[0]
    assert fk.column.table.schema == new_test_schema
