import pytest

from sqlalchemy import MetaData, Table


FILTER_SORT = "filter_sort"


@pytest.fixture
def roster_table_obj(engine_with_roster, roster_table_name):
    engine, schema = engine_with_roster
    metadata = MetaData(bind=engine)
    roster = Table(roster_table_name, metadata, schema=schema, autoload_with=engine)
    return roster, engine


@pytest.fixture
def filter_sort_table_obj(engine_with_filter_sort):
    engine, schema = engine_with_filter_sort
    metadata = MetaData(bind=engine)
    roster = Table(FILTER_SORT, metadata, schema=schema, autoload_with=engine)
    return roster, engine
