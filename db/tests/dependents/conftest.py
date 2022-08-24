import pytest

from db.tables.operations.select import get_oid_from_table


@pytest.fixture
def academics_tables_oids(engine_with_academics):
    engine, schema = engine_with_academics

    universities_oid = get_oid_from_table('universities', schema, engine)
    academics_oid = get_oid_from_table('academics', schema, engine)
    journals_oid = get_oid_from_table('journals', schema, engine)
    articles_oid = get_oid_from_table('articles', schema, engine)
    publishers_oid = get_oid_from_table('publishers', schema, engine)

    return {
        'universities': universities_oid,
        'academics': academics_oid,
        'journals': journals_oid,
        'articles': articles_oid,
        'publishers': publishers_oid
    }
