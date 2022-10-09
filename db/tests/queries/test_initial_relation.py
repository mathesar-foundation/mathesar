# A query's initial relation is the SQL construct built from a query's initial_columns list.
# It defines the starting point on which transformations will be applied.

# Initial columns is an ordered set of columns sourced either from the base table, or from linked
# tables.

from db.columns.operations.select import get_column_attnum_from_name as get_attnum
from db.tables.operations.select import get_oid_from_table
from db.queries.base import DBQuery, InitialColumn
from db.metadata import get_empty_metadata


def test_local_columns(engine_with_academics):
    engine, schema = engine_with_academics
    oid = get_oid_from_table("academics", schema, engine)
    metadata = get_empty_metadata()
    initial_columns = [
        InitialColumn(
            oid,
            get_attnum(oid, 'id', engine, metadata=metadata),
            alias='id',
        ),
        InitialColumn(
            oid,
            get_attnum(oid, 'institution', engine, metadata=metadata),
            alias='institution',
        ),
    ]
    dbq = DBQuery(
        oid,
        initial_columns,
        engine
    )
    records = dbq.get_records()
    assert records == [(1, 1), (2, 1), (3, 2)]


def test_shallow_link(shallow_link_dbquery):
    dbq = shallow_link_dbquery
    records = dbq.get_records()
    assert records == [(1, 'uni1'), (2, 'uni1'), (3, 'uni2')]


def test_deep_link(engine_with_academics):
    engine, schema = engine_with_academics
    art_oid = get_oid_from_table("articles", schema, engine)
    acad_oid = get_oid_from_table("academics", schema, engine)
    uni_oid = get_oid_from_table("universities", schema, engine)
    metadata = get_empty_metadata()
    initial_columns = [
        InitialColumn(
            art_oid,
            get_attnum(art_oid, 'title', engine, metadata=metadata),
            alias='title',
        ),
        InitialColumn(
            uni_oid,
            get_attnum(uni_oid, 'name', engine, metadata=metadata),
            alias='primary_author_institution_name',
            jp_path=[
                [
                    (art_oid, get_attnum(art_oid, 'primary_author', engine, metadata=metadata)),
                    (acad_oid, get_attnum(acad_oid, 'id', engine, metadata=metadata)),
                ],
                [
                    (acad_oid, get_attnum(acad_oid, 'institution', engine, metadata=metadata)),
                    (uni_oid, get_attnum(uni_oid, 'id', engine, metadata=metadata)),
                ]
            ],
        ),
    ]
    dbq = DBQuery(
        art_oid,
        initial_columns,
        engine
    )
    records = dbq.get_records()
    assert records == [('article1', 'uni1'), ('article2', 'uni1')]


def test_self_referencing_table(engine_with_academics):
    engine, schema = engine_with_academics
    acad_oid = get_oid_from_table("academics", schema, engine)
    metadata = get_empty_metadata()
    initial_columns = [
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'id', engine, metadata=metadata),
            alias='id',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=metadata),
            alias='advisor name',
            jp_path=[
                [
                    (acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=metadata)),
                    (acad_oid, get_attnum(acad_oid, 'id', engine, metadata=metadata)),
                ]
            ],
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=metadata),
            alias='advisee name',
            jp_path=[
                [
                    (acad_oid, get_attnum(acad_oid, 'id', engine, metadata=metadata)),
                    (acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=metadata)),
                ]
            ],
        ),
    ]
    dbq = DBQuery(
        acad_oid,
        initial_columns,
        engine
    )
    records = dbq.get_records()
    assert sorted(records, key=lambda t: t[0]) == [
        (1, 'academic2', None),
        (2, 'academic3', 'academic1'),
        (3, None, 'academic2'),
    ]
