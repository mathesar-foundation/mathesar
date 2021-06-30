from datetime import datetime
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


op_to_python_func = {
    "is_null": lambda x, _: x is None,
    "is_not_null": lambda x, _: x is not None,
    "eq": lambda x, v: x == v,
    "ne": lambda x, v: x != v,
    "gt": lambda x, v: x > v,
    "lt": lambda x, v: x < v,
    "ge": lambda x, v: x >= v,
    "le": lambda x, v: x <= v,
    "like": _like,
    "ilike": _ilike,
    "not_ilike": lambda x, v: not _ilike(x, v),
    "in": lambda x, v: x in v,
    "not_in": lambda x, v: x not in v,
    "any": lambda x, v: v in x,
    "not_any": lambda x, v: v not in x,
    "and": lambda x: all(x),
    "or": lambda x: any(x),
    "not": lambda x: not x
}


ops_test_list = [
    # is_null
    ("varchar", "is_null", None, 5),
    ("numeric", "is_null", None, 5),
    ("date", "is_null", None, 5),
    ("array", "is_null", None, 5),
    # is_not_null
    ("varchar", "is_not_null", None, 100),
    ("numeric", "is_not_null", None, 100),
    ("date", "is_not_null", None, 100),
    ("array", "is_not_null", None, 100),
    # eq
    ("varchar", "eq", "string42", 1),
    ("numeric", "eq", 1, 1),
    ("date", "eq", "2000-01-01", 1),
    ("array", "eq", "{0,0}", 1),
    # ne
    ("varchar", "ne", "string42", 99),
    ("numeric", "ne", 1, 99),
    ("date", "ne", "2000-01-01", 99),
    ("array", "ne", "{0,0}", 99),
    # gt
    ("varchar", "gt", "string0", 100),
    ("numeric", "gt", 50, 50),
    ("date", "gt", "2000-01-01", 99),
    # lt
    ("varchar", "lt", "stringA", 100),
    ("numeric", "lt", 51, 50),
    ("date", "lt", "2099-01-01", 99),
    # ge
    ("varchar", "ge", "string1", 100),
    ("numeric", "ge", 50, 51),
    ("date", "ge", "2000-01-01", 100),
    # le
    ("varchar", "le", "string2", 13),
    ("numeric", "le", 51, 51),
    ("date", "le", "2099-01-01", 100),
    # like
    ("varchar", "like", "%1", 10),
    # ilike
    ("varchar", "ilike", "STRING1%", 12),
    # not_ilike
    ("varchar", "not_ilike", "STRING1%", 88),
    # in
    ("varchar", "in", ["string1", "string2", "string3"], 3),
    ("numeric", "in", [1, 2, 3], 3),
    # not_in
    ("varchar", "not_in", ["string1", "string2", "string3"], 97),
    ("numeric", "not_in", [1, 2, 3], 97),
    # any
    ("array", "any", 1, 1),
    # not_any
    ("array", "not_any", 1, 99),
]


@pytest.mark.parametrize("column,op,value,res_len", ops_test_list)
def test_get_records_filters_ops(
    filter_sort_table_obj, column, op, value, res_len
):
    filter_sort, engine = filter_sort_table_obj
    filter_list = [{"field": column, "op": op}]
    if value is not None:
        filter_list[0]["value"] = value

    record_list = records.get_records(
        filter_sort, engine, filters=filter_list
    )

    if column == "date" and value is not None:
        value = datetime.strptime(value, "%Y-%m-%d").date()
    elif column == "array" and value is not None and op not in ["any", "not_any"]:
        value = [int(c) for c in value[1:-1].split(",")]

    assert len(record_list) == res_len
    for record in record_list:
        val_func = op_to_python_func[op]
        assert val_func(getattr(record, column), value)


ops_variant_test_list = [
    ("eq", "=="),
    ("ne", "!="),
    ("gt", ">"),
    ("lt", "<"),
    ("ge", ">="),
    ("le", "<=")
]


@pytest.mark.parametrize("op,variant_op", ops_variant_test_list)
def test_get_records_filters_variant_ops(filter_sort_table_obj, op, variant_op):
    filter_sort, engine = filter_sort_table_obj

    filter_list = [{"field": "numeric", "op": op, "value": 50}]
    record_list = records.get_records(
        filter_sort, engine, filters=filter_list
    )

    filter_list = [{"field": "numeric", "op": variant_op, "value": 50}]
    variant_record_list = records.get_records(
        filter_sort, engine, filters=filter_list
    )

    assert len(record_list) == len(variant_record_list)
    for record, variant_record in zip(record_list, variant_record_list):
        assert record == variant_record
