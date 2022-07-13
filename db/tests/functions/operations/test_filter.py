import re
import pytest

from db.utils import execute_query

from db.functions.base import (
    ColumnName, Not, Literal, Empty, Equal, Greater, And, Or, StartsWith, Contains, StartsWithCaseInsensitive, ContainsCaseInsensitive
)
from db.functions.packed import (
    GreaterOrEqual, LesserOrEqual
)
from db.functions.operations.apply import apply_db_function_as_filter


def _like(x, v):
    return re.match(v.replace("%", ".*"), x) is not None


def _ilike(x, v):
    return re.match(v.replace("%", ".*").lower(), x.lower()) is not None


database_functions = {
    "is_null": lambda x: Empty([ColumnName([x])]),
    "is_not_null": lambda x: Not([Empty([ColumnName([x])])]),
    "eq": lambda x, v: Equal([ColumnName([x]), Literal([v])]),
    "gt": lambda x, v: Greater([ColumnName([x]), Literal([v])]),
    "and": lambda x: And(x),
    "or": lambda x: Or(x),
    "not": lambda x: Not(x),
    "ge": lambda x, v: GreaterOrEqual([ColumnName([x]), Literal([v])]),
    "le": lambda x, v: LesserOrEqual([ColumnName([x]), Literal([v])]),
    "starts_with": lambda x, v: StartsWith([ColumnName([x]), Literal([v])]),
    "contains": lambda x, v: Contains([ColumnName([x]), Literal([v])]),
}


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
    "not": lambda x: not x[0],
    "starts_with": lambda x, v: x.startswith(v),
    "contains": lambda x, v: v in x,
}


# Table can be examined in db/tests/resources/filter_sort_create.sql
ops_test_list = [
    # starts_with
    ("varchar", "starts_with", "string9", 11),
    # contains
    ("varchar", "contains", "g9", 11),
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
    ("date", "eq", "2000-01-01 AD", 1),
    ("array", "eq", "{0,0}", 1),
    # gt
    ("varchar", "gt", "string0", 100),
    ("numeric", "gt", 50, 50),
    ("date", "gt", "2000-01-01 AD", 99),
    # ge
    ("varchar", "ge", "string1", 100),
    ("numeric", "ge", 50, 51),
    ("date", "ge", "2000-01-01 AD", 100),
    # le
    ("varchar", "le", "string2", 13),
    ("numeric", "le", 51, 51),
    ("date", "le", "2099-01-01 AD", 100),
]


@pytest.mark.parametrize("column_name,op,value,res_len", ops_test_list)
def test_filter_with_db_functions(
    filter_sort_table_obj, column_name, op, value, res_len
):
    table, engine = filter_sort_table_obj

    db_function_lambda = database_functions[op]

    if value:
        db_function = db_function_lambda(column_name, value)
    else:
        db_function = db_function_lambda(column_name)

    relation = table.select()

    query = apply_db_function_as_filter(relation, db_function)

    record_list = execute_query(engine, query)

    if column_name == "array" and value is not None and op not in ["any", "not_any"]:
        value = [int(c) for c in value[1:-1].split(",")]

    assert len(record_list) == res_len
    for record in record_list:
        val_func = op_to_python_func[op]
        actual_value = getattr(record, column_name)
        assert val_func(actual_value, value)


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


@pytest.mark.parametrize("op,column_name_and_val_pairs,res_len", boolean_ops_test_list)
def test_filter_boolean_ops(
    filter_sort_table_obj, op, column_name_and_val_pairs, res_len
):
    table, engine = filter_sort_table_obj

    db_function_lambda = database_functions[op]

    db_function = db_function_lambda([
        Equal([ColumnName([column_name]), value])
        for column_name, value in column_name_and_val_pairs
    ])

    relation = table.select()

    query = apply_db_function_as_filter(relation, db_function)

    record_list = execute_query(engine, query)

    assert len(record_list) == res_len
    for record in record_list:
        val_func = op_to_python_func[op]
        args = [
            getattr(record, column_name) == value
            for column_name, value in column_name_and_val_pairs
        ]
        assert val_func(args)


def test_filtering_nested_boolean_ops(filter_sort_table_obj):
    table, engine = filter_sort_table_obj

    db_function = And([
        Or([
            Equal([ColumnName(["varchar"]), Literal(["string24"])]),
            Equal([ColumnName(["numeric"]), Literal([42])]),
        ]),
        Or([
            Equal([ColumnName(["varchar"]), Literal(["string42"])]),
            Equal([ColumnName(["numeric"]), Literal([24])]),
        ]),
    ])

    relation = table.select()

    query = apply_db_function_as_filter(relation, db_function)

    record_list = execute_query(engine, query)

    assert len(record_list) == 2
    for record in record_list:
        assert ((record.varchar == "string24" or record.numeric == 42)
                and (record.varchar == "string42" or record.numeric == 24))


@pytest.mark.parametrize("column_name,main_db_function,literal_param,expected_count", [
    ("time", Equal, "06:05:06.789", 1),
    ("date", Equal, "1999-01-08", 1),
    ("time", LesserOrEqual, "04:05:06.789", 5),
    ("timestamp", Greater, "1995-01-08", 1),
    ("interval", Greater, "P1Y2M3DT4H5M6S", 5),
])
def test_filtering_time_types(times_table_obj, column_name, main_db_function, literal_param, expected_count):
    _filters_as_expected(times_table_obj, column_name, main_db_function, literal_param, expected_count)


@pytest.mark.parametrize("column_name,main_db_function,literal_param,expected_count", [
    ("boolean", Equal, True, 3),
    ("boolean", Equal, False, 1),
    ("boolean", And, True, 3),
    ("boolean", Or, True, 4),
    ("boolean", Or, False, 3),
])
def test_filtering_booleans(boolean_table_obj, column_name, main_db_function, literal_param, expected_count):
    _filters_as_expected(boolean_table_obj, column_name, main_db_function, literal_param, expected_count)


@pytest.mark.parametrize("column_name,main_db_function,literal_param,expected_count", [
    ("Student Name", StartsWithCaseInsensitive, "stephanie", 15),
    ("Student Name", StartsWith, "stephanie", 0),
    ("Student Name", ContainsCaseInsensitive, "JUAREZ", 5),
    ("Student Name", Contains, "juarez", 0),
])
def test_case_insensitive_filtering(roster_table_obj, column_name, main_db_function, literal_param, expected_count):
    _filters_as_expected(roster_table_obj, column_name, main_db_function, literal_param, expected_count)


def _filters_as_expected(table_engine, column_name, main_db_function, literal_param, expected_count):
    table, engine = table_engine
    selectable = table.select()
    db_function = main_db_function([
        ColumnName([column_name]),
        Literal([literal_param]),
    ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_query(engine, query)
    assert len(record_list) == expected_count
