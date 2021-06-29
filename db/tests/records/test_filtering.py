import pytest
from sqlalchemy import MetaData, Table
from db import records


ROSTER = "Roster"
FILTERSORT = "FilterSort"


@pytest.fixture
def roster_table_obj(engine_with_roster):
    engine, schema = engine_with_roster
    metadata = MetaData(bind=engine)
    roster = Table(ROSTER, metadata, schema=schema, autoload_with=engine)
    return roster, engine


@pytest.fixture
def filter_sort_table_obj(engine_with_filter_sort):
    engine, schema = engine_with_filter_sort
    metadata = MetaData(bind=engine)
    roster = Table(FILTERSORT, metadata, schema=schema, autoload_with=engine)
    return roster, engine


def test_get_records_filters_using_col_str_names(roster_table_obj):
    roster, engine = roster_table_obj
    filter_list = [
        {"field": "Student Name", "op": "==", "value": "Amy Gamble"},
        {"field": "Subject", "op": "==", "value": "Math"}
    ]
    record_list = records.get_records(
        roster, engine, filters=filter_list
    )
    assert all(
        [
            len(record_list) == 1,
            record_list[0][2] == "Amy Gamble",
            record_list[0][6] == "Math",
        ]
    )


def test_get_records_filters_using_col_objects(roster_table_obj):
    roster, engine = roster_table_obj
    filter_list = [
        {"field": roster.columns["Student Name"], "op": "==", "value": "Amy Gamble"},
        {"field": roster.columns["Subject"], "op": "==", "value": "Math"}
    ]
    record_list = records.get_records(
        roster, engine, filters=filter_list
    )
    assert all(
        [
            len(record_list) == 1,
            record_list[0][2] == "Amy Gamble",
            record_list[0][6] == "Math",
        ]
    )


def test_get_records_filters_using_mixed_col_objects_and_str(roster_table_obj):
    roster, engine = roster_table_obj
    filter_list = [
        {"field": roster.columns["Student Name"], "op": "==", "value": "Amy Gamble"},
        {"field": "Subject", "op": "==", "value": "Math"}
    ]
    record_list = records.get_records(
        roster, engine, filters=filter_list
    )
    assert all(
        [
            len(record_list) == 1,
            record_list[0][2] == "Amy Gamble",
            record_list[0][6] == "Math",
        ]
    )


def test_get_records_filters_with_numeric_col(roster_table_obj):
    roster, engine = roster_table_obj
    filter_list = [
        {"field": roster.columns["Student Name"], "op": "==", "value": "Amy Gamble"},
        {"field": roster.columns["Grade"], "op": "==", "value": 74}
    ]
    record_list = records.get_records(
        roster, engine, filters=filter_list
    )
    assert all(
        [
            len(record_list) == 1,
            record_list[0][2] == "Amy Gamble",
            record_list[0][7] == 74,
        ]
    )


def test_get_records_filters_with_miss(roster_table_obj):
    roster, engine = roster_table_obj
    filter_list = [
        {"field": roster.columns["Student Name"], "op": "==", "value": "Amy Gamble"},
        {"field": roster.columns["Grade"], "op": "==", "value": 75}
    ]
    record_list = records.get_records(
        roster, engine, filters=filter_list
    )
    assert len(record_list) == 0
