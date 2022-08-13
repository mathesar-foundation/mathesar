# A query's initial relation is the SQL construct built from a query's initial_columns list.
# It defines the starting point on which transformations will be applied.

# Initial columns is an ordered set of columns sourced either from the base table, or from linked
# tables.

from db.queries.base import DBQuery, InitialColumn, JoinParams


def test_local_columns(engine, academics_db_tables):
    base_table = academics_db_tables['academics']
    initial_columns = [
        InitialColumn(
            alias='id',
            column=base_table.c.id,
        ),
        InitialColumn(
            alias='institution',
            column=base_table.c.institution,
        ),
    ]
    dbq = DBQuery(
        base_table=base_table,
        initial_columns=initial_columns,
    )
    records = dbq.get_records(engine=engine)
    assert records == [(1, 1), (2, 1), (3, 2)]


def test_shallow_link(engine, shallow_link_dbquery):
    dbq = shallow_link_dbquery
    records = dbq.get_records(engine=engine)
    assert records == [(1, 'uni1'), (2, 'uni1'), (3, 'uni2')]


def test_deep_link(engine, academics_db_tables):
    art_table = academics_db_tables['articles']
    acad_table = academics_db_tables['academics']
    uni_table = academics_db_tables['universities']
    initial_columns = [
        InitialColumn(
            alias='title',
            column=art_table.c.title,
        ),
        InitialColumn(
            alias='primary_author_institution_name',
            column=uni_table.c.name,
            jp_path=[
                JoinParams(
                    left_column=art_table.c.primary_author,
                    right_column=acad_table.c.id,
                ),
                JoinParams(
                    left_column=acad_table.c.institution,
                    right_column=uni_table.c.id,
                ),
            ],
        ),
    ]
    dbq = DBQuery(
        base_table=art_table,
        initial_columns=initial_columns,
    )
    records = dbq.get_records(engine=engine)
    assert records == [('article1', 'uni1'), ('article2', 'uni1')]


def test_self_referencing_table(engine, academics_db_tables):
    acad_table = academics_db_tables['academics']
    initial_columns = [
        InitialColumn(
            alias='id',
            column=acad_table.c.id,
        ),
        InitialColumn(
            alias='advisor name',
            column=acad_table.c.name,
            jp_path=[
                JoinParams(
                    left_column=acad_table.c.advisor,
                    right_column=acad_table.c.id,
                ),
            ],
        ),
        InitialColumn(
            alias='advisee name',
            column=acad_table.c.name,
            jp_path=[
                JoinParams(
                    left_column=acad_table.c.id,
                    right_column=acad_table.c.advisor,
                ),
            ],
        ),
    ]
    dbq = DBQuery(
        base_table=acad_table,
        initial_columns=initial_columns,
    )
    records = dbq.get_records(engine=engine)
    assert records == [(2, 'academic3', 'academic1')]
