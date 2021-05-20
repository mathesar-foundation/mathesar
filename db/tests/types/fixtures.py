import pytest
from sqlalchemy.schema import CreateSchema, DropSchema
from db.engine import _add_custom_types_to_engine
from db.types import base, install

TEST_SCHEMA = "test_schema"


@pytest.fixture
def engine_with_types(engine):
    _add_custom_types_to_engine(engine)
    return engine


@pytest.fixture
def temporary_testing_schema(engine_with_types):
    schema = TEST_SCHEMA
    with engine_with_types.begin() as conn:
        conn.execute(CreateSchema(schema))
    yield engine_with_types, schema
    with engine_with_types.begin() as conn:
        conn.execute(DropSchema(schema, cascade=True, if_exists=True))


@pytest.fixture
def engine_email_type(temporary_testing_schema):
    engine, schema = temporary_testing_schema
    install.install_mathesar_on_database(engine)
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))
