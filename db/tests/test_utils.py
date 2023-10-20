import pytest
from sqlalchemy import MetaData, Column, String, Table

from db.columns.utils import get_enriched_column_table
from db.metadata import get_empty_metadata
from db.install import install_mathesar
from conftest import _drop_database


def test_get_enriched_column_table(engine):
    abc = "abc"
    table = Table("testtable", MetaData(), Column(abc, String), Column('def', String))
    enriched_table = get_enriched_column_table(table, engine=engine, metadata=get_empty_metadata())
    assert enriched_table.columns[abc].engine == engine


def test_get_enriched_column_table_no_engine():
    abc = "abc"
    table = Table("testtable", MetaData(), Column(abc, String), Column('def', String))
    enriched_table = get_enriched_column_table(table, metadata=get_empty_metadata())
    assert enriched_table.columns[abc].engine is None


@pytest.fixture
def install_fixture(FUN_engine_cache, SES_engine_cache, get_uid, root_credentials):
    db_name = get_uid()
    credentials = root_credentials._replace(db_name=db_name)
    # Will create a db
    # Note, does not use cached engines, may leak
    install_mathesar(credentials)
    yield
    engine = FUN_engine_cache(db_name)
    _drop_database(engine, SES_engine_cache)


def test_install(install_fixture):
    """
    Tests that the instralling fixture doesn't panic. As of time of writing,
    our tests use a different set of routines for setting up a database (would
    be nice to fix that), so need this test to have full(-er?) coverage.
    """
    pass
