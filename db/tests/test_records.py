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


def test_get_records_gets_ordered_records_str_col_name(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = records.get_records(roster, engine, order_by=["Teacher"])
    assert record_list[0][4] == "Amber Hudson"


def test_get_records_gets_ordered_records_num_col(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = records.get_records(roster, engine, order_by=["Grade"])
    assert record_list[0][7] == 25


def test_get_records_gets_ordered_records_str_col_obj(roster_table_obj):
    roster, engine = roster_table_obj
    teacher_col = roster.columns["Teacher"]
    record_list = records.get_records(roster, engine, order_by=[teacher_col])
    assert record_list[0][4] == "Amber Hudson"


def test_get_records_gets_ordered_records_num_col_obj(roster_table_obj):
    roster, engine = roster_table_obj
    grade_col = roster.columns["Grade"]
    record_list = records.get_records(roster, engine, order_by=[grade_col])
    assert record_list[0][7] == 25


def test_get_records_ordered_col_set(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = records.get_records(
        roster, engine, order_by=["Student Name", "Grade"]
    )
    assert record_list[0][2] == "Alejandro Lam" and record_list[0][7] == 40


def test_get_records_ordered_col_set_different_col_order(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = records.get_records(
        roster, engine, order_by=["Grade", "Student Name"]
    )
    assert record_list[0][7] == 25 and record_list[0][2] == "Amy Gamble"


def test_get_records_orders_before_limiting(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = records.get_records(
        roster, engine, limit=1, order_by=["Grade", "Student Name"]
    )
    assert record_list[0][7] == 25 and record_list[0][2] == "Amy Gamble"


def test_get_records_filters_using_col_str_names(roster_table_obj):
    roster, engine = roster_table_obj
    filter_list = [("Student Name", "Amy Gamble"), ("Subject", "Math")]
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
        (roster.columns["Student Name"], "Amy Gamble"),
        (roster.columns["Subject"], "Math"),
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
        (roster.columns["Student Name"], "Amy Gamble"),
        ("Subject", "Math"),
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
        (roster.columns["Student Name"], "Amy Gamble"),
        (roster.columns["Grade"], 74),
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
        (roster.columns["Student Name"], "Amy Gamble"),
        (roster.columns["Grade"], 75),
    ]
    record_list = records.get_records(
        roster, engine, filters=filter_list
    )
    assert len(record_list) == 0


def test_get_distinct_tuple_values_length(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        roster.columns["Student Number"],
        roster.columns["Student Email"],
    ]
    record_list = records.get_distinct_tuple_values(
        column_list, engine
    )
    assert len(record_list) == 259


def test_get_distinct_tuple_values_distinct(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        roster.columns["Student Number"],
        roster.columns["Student Email"],
    ]
    record_list = records.get_distinct_tuple_values(
        column_list, engine
    )
    for i in range(len(record_list) - 1):
        assert record_list[i] != record_list[i + 1]


def test_get_distinct_tuple_values_raises_when_no_table(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    with pytest.raises(AssertionError):
        records.get_distinct_tuple_values(
            column_list, engine
        )


def test_get_distinct_tuple_values_with_string_column_input(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    record_list = records.get_distinct_tuple_values(
        column_list, engine, table=roster,
    )
    assert len(record_list) == 259


def test_get_distinct_tuple_values_limit(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    record_list = records.get_distinct_tuple_values(
        column_list, engine, table=roster, limit=10
    )
    assert len(record_list) == 10


def test_get_distinct_tuple_values_offset(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    record_list_base = records.get_distinct_tuple_values(
        column_list, engine, table=roster, limit=20
    )
    record_list_offset = records.get_distinct_tuple_values(
        column_list, engine, table=roster, limit=10, offset=10
    )
    assert record_list_offset == record_list_base[10:]


def test_get_distinct_tuple_values_feeds_get_records(roster_table_obj):
    roster, engine = roster_table_obj
    column_list = [
        "Student Number",
        "Student Email",
    ]
    distinct_tuples = records.get_distinct_tuple_values(
        column_list, engine, table=roster, limit=2
    )
    record_list = records.get_records(
        roster, engine, filters=distinct_tuples[0]
    )
    assert all(
        [
            record[1] == distinct_tuples[0][0][1]
            and record[3] == distinct_tuples[0][1][1]
            for record in record_list
        ]
    )
