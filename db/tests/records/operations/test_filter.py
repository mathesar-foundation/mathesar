import re
import pytest
from datetime import datetime

from sqlalchemy_filters.exceptions import BadFilterFormat, FilterFieldNotFound

from db.records.operations.select import get_records
from db.filters.base import MultiParameter, SingleParameter, get_predicate_subclass_by_type_str


def test_get_records_filters_using_col_str_names(roster_table_obj):
    roster, engine = roster_table_obj
    filters = {"and": [
        {"equal": {"column": "Student Name", "parameter": "Amy Gamble"}},
        {"equal": {"column": "Subject", "parameter": "Math"}},
    ]}
    record_list = get_records(
        roster, engine, filters=filters
    )
    assert all(
        [
            len(record_list) == 1,
            record_list[0][2] == "Amy Gamble",
            record_list[0][6] == "Math",
        ]
    )


# TODO no: remove these tests
@pytest.mark.skip(reason="should this be implemented?")
def test_get_records_filters_using_col_objects(roster_table_obj):
    roster, engine = roster_table_obj
    filters = {"and": [
        {"column": roster.columns["Student Name"], "parameter": "Amy Gamble"},
        {"column": roster.columns["Subject"], "parameter": "Math"}
    ]}
    record_list = get_records(
        roster, engine, filters=filters
    )
    assert all(
        [
            len(record_list) == 1,
            record_list[0][2] == "Amy Gamble",
            record_list[0][6] == "Math",
        ]
    )


@pytest.mark.skip(reason="should this be implemented?")
def test_get_records_filters_using_mixed_col_objects_and_str(roster_table_obj):
    roster, engine = roster_table_obj
    filters = {"and": [
        {"column": roster.columns["Student Name"], "parameter": "Amy Gamble"},
        {"equal": {"column": "Subject", "parameter": "Math"}},
    ]}
    record_list = get_records(
        roster, engine, filters=filters
    )
    assert all(
        [
            len(record_list) == 1,
            record_list[0][2] == "Amy Gamble",
            record_list[0][6] == "Math",
        ]
    )


@pytest.mark.skip(reason="should this be implemented?")
def test_get_records_filters_with_miss(roster_table_obj):
    roster, engine = roster_table_obj
    # TODO rewrite filter spec
    filters = [
        {"column": roster.columns["Student Name"], "op": "==", "parameter": "Amy Gamble"},
        {"column": roster.columns["Grade"], "op": "==", "parameter": 75}
    ]
    record_list = get_records(
        roster, engine, filters=filters
    )
    assert len(record_list) == 0


def _like(x, v):
    return re.match(v.replace("%", ".*"), x) is not None


def _ilike(x, v):
    return re.match(v.replace("%", ".*").lower(), x.lower()) is not None


parameter_to_python_func = {
    "empty": lambda x, _: x is None,
    "not_empty": lambda x, _: x is not None,
    "equal": lambda x, v: x == v,
    "not_equal": lambda x, v: x != v,
    "greater": lambda x, v: x > v,
    "lesser": lambda x, v: x < v,
    "greater_or_equal": lambda x, v: x >= v,
    "lesser_or_equal": lambda x, v: x <= v,
    # "like": _like,
    # "ilike": _ilike,
    # "not_ilike": lambda x, v: not _ilike(x, v),
    "starts_with": lambda x, v: x.startswith(v),
    "ends_with": lambda x, v: x.endswith(v),
    "contains": lambda x, v: x.find(v) != -1,
    "in": lambda x, v: x in v,
    "not_in": lambda x, v: x not in v,
    # "any": lambda x, v: v in x,
    # "not_any": lambda x, v: v not in x,
    "and": lambda x: all(x),
    "or": lambda x: any(x),
    "not": lambda x: not x[0],
}


parameter_test_list = [
    # empty
    ("varchar", "empty", None, 5),
    ("numeric", "empty", None, 5),
    ("date", "empty", None, 5),
    ("array", "empty", None, 5),
    # not_empty
    ("varchar", "not_empty", None, 100),
    ("numeric", "not_empty", None, 100),
    ("date", "not_empty", None, 100),
    ("array", "not_empty", None, 100),
    # equal
    ("varchar", "equal", "string42", 1),
    ("numeric", "equal", 1, 1),
    ("date", "equal", "2000-01-01", 1),
    ("array", "equal", "{0,0}", 1),
    # not_equal
    ("varchar", "not_equal", "string42", 99),
    ("numeric", "not_equal", 1, 99),
    ("date", "not_equal", "2000-01-01", 99),
    ("array", "not_equal", "{0,0}", 99),
    # greater
    ("varchar", "greater", "string0", 100),
    ("numeric", "greater", 50, 50),
    ("date", "greater", "2000-01-01", 99),
    # lesser
    ("varchar", "lesser", "stringA", 100),
    ("numeric", "lesser", 51, 50),
    ("date", "lesser", "2099-01-01", 99),
    # greater_or_equal
    ("varchar", "greater_or_equal", "string1", 100),
    ("numeric", "greater_or_equal", 50, 51),
    ("date", "greater_or_equal", "2000-01-01", 100),
    # lesser_or_equal
    ("varchar", "lesser_or_equal", "string2", 13),
    ("numeric", "lesser_or_equal", 51, 51),
    ("date", "lesser_or_equal", "2099-01-01", 100),
    # like
    # ("varchar", "like", "%1", 10),
    # ends_with
    ("varchar", "ends_with", "1", 10),
    # ilike
    # ("varchar", "ilike", "STRING1%", 12),
    # starts_with
    ("varchar", "starts_with", "string1", 12),
    # contains
    ("varchar", "contains", "g1", 12),
    # not_ilike
    # ("varchar", "not_ilike", "STRING1%", 88),
    # in
    ("varchar", "in", ["string1", "string2", "string3"], 3),
    ("numeric", "in", [1, 2, 3], 3),
    # not_in
    ("varchar", "not_in", ["string1", "string2", "string3"], 97),
    ("numeric", "not_in", [1, 2, 3], 97),
    # any
    # ("array", "any", 1, 1),
    # not_any
    # ("array", "not_any", 1, 99),
]


@pytest.mark.parametrize("column,predicate_id,parameter,res_len", parameter_test_list)
def test_get_records_filters_ops(
    filter_sort_table_obj, column, predicate_id, parameter, res_len
):
    filter_sort, engine = filter_sort_table_obj
    predicate = get_predicate_subclass_by_type_str(predicate_id)
    if issubclass(predicate, MultiParameter):
        filters = {predicate_id: {"column": column, "parameters": parameter}}
    elif issubclass(predicate, SingleParameter):
        filters = {predicate_id: {"column": column, "parameter": parameter}}
    else:
        filters = {predicate_id: {"column": column}}

    record_list = get_records(filter_sort, engine, filters=filters)

    if column == "date" and parameter is not None:
        parameter = datetime.strptime(parameter, "%Y-%m-%d").date()
    elif column == "array" and parameter is not None and predicate_id not in ["any", "not_any"]:
        parameter = [int(c) for c in parameter[1:-1].split(",")]

    assert len(record_list) == res_len
    for record in record_list:
        val_func = parameter_to_python_func[predicate_id]
        assert val_func(getattr(record, column), parameter)


variant_ops_test_list = [
    ("equal", "=="),
    ("not_equal", "!="),
    ("greater", ">"),
    ("lesser", "<"),
    ("greater_or_equal", ">="),
    ("lesser_or_equal", "<=")
]


@pytest.mark.skip(reason="should this be implemented?")
@pytest.mark.parametrize("predicate_id,variant_op", variant_ops_test_list)
def test_get_records_filters_variant_ops(
    filter_sort_table_obj, predicate_id, variant_op
):
    filter_sort, engine = filter_sort_table_obj

    filters = {predicate_id: {"column": "numeric", "parameter": 50}}
    record_list = get_records(filter_sort, engine, filters=filters)

    filters = {variant_op: {"column": "numeric", "parameter": 50}}
    variant_record_list = get_records(filter_sort, engine, filters=filters)

    assert len(record_list) == len(variant_record_list)
    for record, variant_record in zip(record_list, variant_record_list):
        assert record == variant_record


boolean_ops_test_list = [
    ("and", [("numeric", 1)], 1),
    ("and", [("numeric", 1), ("numeric", 2)], 0),
    ("and", [("numeric", 1), ("varchar", "string2")], 0),
    ("or", [("numeric", 1)], 1),
    ("or", [("numeric", 1), ("numeric", 2)], 2),
    ("or", [("numeric", 1), ("varchar", "string2")], 2),
    ("not", [("numeric", 1)], 99),
    ("not", [("varchar", "string1")], 99),
]


@pytest.mark.parametrize("op,column_val_pairs,res_len", boolean_ops_test_list)
def test_get_records_filters_boolean_ops(
    filter_sort_table_obj, op, column_val_pairs, res_len
):
    filter_sort, engine = filter_sort_table_obj

    predicate = get_predicate_subclass_by_type_str(op)
    if issubclass(predicate, SingleParameter):
        filters = {op: [
            {"equal": {"column": column, "parameter": parameter}}
            for column, parameter in column_val_pairs
        ][0]}
    else:
        filters = {op: [
            {"equal": {"column": column, "parameter": parameter}}
            for column, parameter in column_val_pairs
        ]}
    record_list = get_records(filter_sort, engine, filters=filters)

    assert len(record_list) == res_len
    for record in record_list:
        val_func = parameter_to_python_func[op]
        args = [getattr(record, column) == parameter for column, parameter in column_val_pairs]
        assert val_func(args)


def test_get_records_filters_nested_boolean_ops(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj

    filters = {"and": [
        {"or": [
            {"equal": {"column": "varchar", "parameter": "string24"}},
            {"equal": {"column": "numeric", "parameter": 42}},
        ]},
        {"or": [
            {"equal": {"column": "varchar", "parameter": "string42"}},
            {"equal": {"column": "numeric", "parameter": 24}},
        ]},
    ]}
    record_list = get_records(filter_sort, engine, filters=filters)

    assert len(record_list) == 2
    for record in record_list:
        assert ((record.varchar == "string24" or record.numeric == 42)
                and (record.varchar == "string42" or record.numeric == 24))


exceptions_test_list = [
    ({"column": "tuple", "op": "equal", "parameter": "test"}, BadFilterFormat),
    (["column", "tuple", "op", "equal", "parameter", "test"], BadFilterFormat),
    ({"non_existant": {"column": "varchar", "parameter": "test"}}, BadFilterFormat),
    ({"equal": {"parameter": "test"}}, BadFilterFormat),
    ({"equal": {"column": "varchar"}}, BadFilterFormat),
    ({"and": []}, BadFilterFormat),
    ({"or": []}, BadFilterFormat),
    ({"not": []}, BadFilterFormat),
    ({"and": [{"empty": {"column": "date"}} for _ in range(2)]}, BadFilterFormat),
    ({"equal": {"column": "non_existent", "parameter": "test"}}, FilterFieldNotFound),
]


@pytest.mark.parametrize("filters,exception", exceptions_test_list)
def test_get_records_filters_exceptions(filter_sort_table_obj, filters, exception):
    filter_sort, engine = filter_sort_table_obj
    with pytest.raises(exception):
        get_records(filter_sort, engine, filters=filters)
