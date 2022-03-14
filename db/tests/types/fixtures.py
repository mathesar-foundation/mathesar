"""
The fixtures defined here are specifically defined in a non-standard
location in order to avoid them being automatically picked up by pytest
and made available to all test files.  Specifically, we should not use
these in testing either `db.types.base`, or `db.types.install`, since
those are imports that are used in these fixtures.
"""

import pytest
from sqlalchemy import MetaData, Table
from sqlalchemy.schema import CreateSchema, DropSchema
from db.engine import _add_custom_types_to_engine
from db.tables.operations.select import get_oid_from_table
from db.types import base, install
from db.columns.operations.alter import alter_column_type

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


@pytest.fixture
def uris_table_obj(engine_with_uris, uris_table_name):
    engine, schema = engine_with_uris
    metadata = MetaData(bind=engine)
    table = Table(uris_table_name, metadata, schema=schema, autoload_with=engine)
    # Cast "uri" column from string to URI
    with engine.begin() as conn:
        uri_column_name = "uri"
        uri_type_id = "uri"
        alter_column_type(
            get_oid_from_table(table.name, schema, engine),
            uri_column_name,
            engine,
            conn,
            uri_type_id,
        )
    yield table, engine


@pytest.fixture
def roster_table_obj(engine_with_roster, roster_table_name):
    engine, schema = engine_with_roster
    metadata = MetaData(bind=engine)
    table = Table(roster_table_name, metadata, schema=schema, autoload_with=engine)
    # Cast "uri" column from string to URI
    with engine.begin() as conn:
        email_column_name = "Teacher Email"
        email_type_id = "email"
        alter_column_type(
            get_oid_from_table(table.name, schema, engine),
            email_column_name,
            engine,
            conn,
            email_type_id,
        )
    yield table, engine
