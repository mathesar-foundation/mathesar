import pytest

from db.tables.operations.select import get_oid_from_table


@pytest.fixture
def library_tables_oids(engine_with_library):
    engine, schema = engine_with_library

    authors_oid = get_oid_from_table('Authors', schema, engine)
    checkouts_oid = get_oid_from_table('Checkouts', schema, engine)
    items_oid = get_oid_from_table('Items', schema, engine)
    patrons_oid = get_oid_from_table('Patrons', schema, engine)
    publications_oid = get_oid_from_table('Publications', schema, engine)
    publishers_oid = get_oid_from_table('Publishers', schema, engine)

    return {
        'Authors': authors_oid,
        'Checkouts': checkouts_oid,
        'Items': items_oid,
        'Patrons': patrons_oid,
        'Publications': publications_oid,
        'Publishers': publishers_oid
    }
