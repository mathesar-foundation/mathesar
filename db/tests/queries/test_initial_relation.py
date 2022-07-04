import pytest

# A query's initial relation is the SQL construct built from a query's initial_columns list.
# It defines the starting point on which transformations will be applied.

# Initial columns is an ordered set of columns sourced either from the base table, or from linked
# tables.

from db.queries.base import DBQuery, InitialColumn, JoinParams


def test_local_columns(engine, academics_tables):
    base_table = academics_tables['academics']
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
    assert records == [(1, 1), (2, 1)]


def test_shallow_link(engine, academics_tables):
    acad_table = academics_tables['academics']
    uni_table = academics_tables['universities']
    initial_columns = [
        InitialColumn(
            alias='id',
            column=acad_table.c.id,
        ),
        InitialColumn(
            alias='institution_name',
            column=uni_table.c.name,
            jp_path=[
                JoinParams(
                    left_column=acad_table.c.institution,
                    right_column=uni_table.c.id,
                ),
            ],
        ),
    ]
    dbq = DBQuery(
        base_table=acad_table,
        initial_columns=initial_columns,
    )
    records = dbq.get_records(engine=engine)
    assert records == [(1, 'uni1'), (2, 'uni1')]


@pytest.mark.skip(reason="not implemented")
def test_deep_link():
    pass


@pytest.mark.skip(reason="not implemented")
def test_self_referencing_table():
    pass
