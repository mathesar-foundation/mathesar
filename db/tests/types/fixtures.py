"""
The fixtures defined here are specifically defined in a non-standard
location in order to avoid them being automatically picked up by pytest
and made available to all test files.  Specifically, we should not use
these in testing either `db.types.base`, or `db.types.install`, since
those are imports that are used in these fixtures.
"""

import pytest
from sqlalchemy.schema import CreateSchema, DropSchema
from db.engine import _add_custom_types_to_engine
from db.types import base, install

TEST_SCHEMA = "test_schema"


@pytest.fixture(scope='module')
def engine_with_types(engine):
    _add_custom_types_to_engine(engine)
    return engine


@pytest.fixture(scope='module')
def engine_email_type(engine_with_types):
    engine = engine_with_types
    install.install_mathesar_on_database(engine)
    yield engine
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


@pytest.fixture
def temporary_testing_schema(engine_email_type):
    schema = TEST_SCHEMA
    with engine_email_type.begin() as conn:
        conn.execute(CreateSchema(schema))
    yield schema
    with engine_email_type.begin() as conn:
        conn.execute(DropSchema(schema, cascade=True, if_exists=True))
