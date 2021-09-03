from sqlalchemy import MetaData, Column, String, Table

from db.tables import utils as table_utils


def test_get_enriched_column_table(engine):
    abc = "abc"
    table = Table("testtable", MetaData(), Column(abc, String), Column('def', String))
    enriched_table = table_utils.get_enriched_column_table(table, engine=engine)
    assert enriched_table.columns[abc].engine == engine


def test_get_enriched_column_table_no_engine():
    abc = "abc"
    table = Table("testtable", MetaData(), Column(abc, String), Column('def', String))
    enriched_table = table_utils.get_enriched_column_table(table)
    assert enriched_table.columns[abc].engine is None
