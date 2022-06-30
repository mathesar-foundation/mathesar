import pytest

# A query's initial relation is the SQL construct built from a query's initial_columns list.
# It defines the starting point on which transformations will be applied.

# Initial columns is an ordered set of columns sourced either from the base table, or from linked
# tables.

from db.queries.base import DBQuery, InitialColumn


@pytest.mark.skip(reason="not implemented")
def test_local_columns(engine):
    base_table = None
    initial_columns = [
        InitialColumn(
            column=base_table.c.x,
        ),
        InitialColumn(
            column=base_table.c.y,
        ),
    ]
    dbq = DBQuery(
        base_table=base_table,
        initial_columns=initial_columns,
    )
    records = dbq.get_records(engine=engine)


@pytest.mark.skip(reason="not implemented")
def test_shallow_link():
    pass


@pytest.mark.skip(reason="not implemented")
def test_deep_link():
    pass


@pytest.mark.skip(reason="not implemented")
def test_self_referencing_table():
    pass
