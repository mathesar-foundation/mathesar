from decimal import Decimal
from collections import Counter
from db.records.operations.select import get_records, get_column_cast_records
from db.types.base import PostgresType
from db.schemas.utils import get_schema_oid_from_name
from db.metadata import get_empty_metadata
from db.tables.operations.select import reflect_table_from_oid


def test_get_records_gets_all_records(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = get_records(roster, engine)
    assert len(record_list) == 1000


def test_get_records_gets_limited_records(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = get_records(roster, engine, limit=10)
    assert len(record_list) == 10


def test_get_records_gets_limited_offset_records(roster_table_obj):
    roster, engine = roster_table_obj
    base_records = get_records(roster, engine, limit=10)
    offset_records = get_records(roster, engine, limit=10, offset=5)
    assert len(offset_records) == 10 and offset_records[0] == base_records[5]


def test_get_records_duplicate_only(roster_table_obj):
    roster, engine = roster_table_obj
    duplicate_only = ["Grade", "Subject"]

    full_record_list = get_records(roster, engine)
    dupe_record_list = get_records(roster, engine, duplicate_only=duplicate_only)

    # Ensures that:
    #   - All duplicate values in the table appeared in our query
    #   - All values in our query are duplicate values
    #   - All duplicate values appear the correct number of times
    all_counter = Counter(tuple(r[c] for c in duplicate_only) for r in full_record_list)
    all_counter = {k: v for k, v in all_counter.items() if v > 1}
    got_counter = Counter(tuple(r[c] for c in duplicate_only) for r in dupe_record_list)
    assert all_counter == got_counter
