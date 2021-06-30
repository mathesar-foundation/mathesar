import pytest
import re
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


def _like(x, v):
    return re.match(v.replace("%", ".*"), x) is not None


def _ilike(x, v):
    return re.match(v.replace("%", ".*").lower(), x.lower()) is not None


ops_test_list = [
    ("varchar", "is_null", None, 5, lambda x, _: x is None),
    ("varchar", "is_not_null", None, 100, lambda x, _: x is not None),
    ("varchar", "eq", "string42", 1, lambda x, v: x == v),
    ("varchar", "ne", "string42", 99, lambda x, v: x != v),
    ("numeric", "gt", 50, 50, lambda x, v: x > v),
    ("numeric", "lt", 51, 50, lambda x, v: x < v),
    ("numeric", "ge", 50, 51, lambda x, v: x >= v),
    ("numeric", "le", 51, 51, lambda x, v: x <= v),
    ("varchar", "like", "%1", 10, _like),
    ("varchar", "ilike", "STRING1%", 12, _ilike),
    ("numeric", "in", [1, 2, 3], 3, lambda x, v: x in v),
    ("numeric", "not_in", [1, 2, 3], 97, lambda x, v: x not in v),
    ("numeric", "in", [1, 2, 3], 3, lambda x, v: x in v),
    ("array", "any", 1, 1, lambda x, v: v in x),
    ("array", "not_any", 1, 99, lambda x, v: v not in x),
]


@pytest.mark.parametrize("column,op,value,res_len,val_func", ops_test_list)
def test_get_records_filters_ops(
    filter_sort_table_obj, column, op, value, res_len, val_func
):
    filter_sort, engine = filter_sort_table_obj
    filter_list = [{"field": column, "op": op}]
    if value is not None:
        filter_list[0]["value"] = value

    record_list = records.get_records(
        filter_sort, engine, filters=filter_list
    )

    assert len(record_list) == res_len
    for record in record_list:
        assert val_func(getattr(record, column), value)
