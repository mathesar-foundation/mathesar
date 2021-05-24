import pytest
from sqlalchemy import MetaData, Table
from db import records

ROSTER = "Roster"


@pytest.fixture
def roster_table_obj(engine_with_roster):
    engine, schema = engine_with_roster
    metadata = MetaData(bind=engine)
    roster = Table(ROSTER, metadata, schema=schema, autoload_with=engine)
    return roster, engine


def test_get_records_gets_all_records(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = records.get_records(roster, engine)
    assert len(record_list) == 1000


def test_get_records_gets_limited_records(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = records.get_records(roster, engine, limit=10)
    assert len(record_list) == 10


def test_get_records_gets_limited_offset_records(roster_table_obj):
    roster, engine = roster_table_obj
    base_records = records.get_records(roster, engine, limit=10)
    offset_records = records.get_records(roster, engine, limit=10, offset=5)
    assert len(offset_records) == 10 and offset_records[0] == base_records[5]
