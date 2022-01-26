import re
import pytest
from datetime import datetime

from db.utils import execute_query

from db.functions.base import ColumnReference, Not, Literal, Empty, Equal, Greater
from db.functions.operations.apply import apply_db_function_as_filter


def _like(x, v):
    return re.match(v.replace("%", ".*"), x) is not None


def _ilike(x, v):
    return re.match(v.replace("%", ".*").lower(), x.lower()) is not None


database_functions = {
    "is_null": lambda x: Empty([ColumnReference([x])]),
    "is_not_null": lambda x: Not([Empty([ColumnReference([x])])]),
    "eq": lambda x, v: Equal([ColumnReference([x]), Literal([v])]),
    "gt": lambda x, v: Greater([ColumnReference([x]), Literal([v])]),
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
    "not": lambda x: not x[0]
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
    # ("varchar", "ne", "string42", 99),
    # ("numeric", "ne", 1, 99),
    # ("date", "ne", "2000-01-01", 99),
    # ("array", "ne", "{0,0}", 99),
    # gt
    ("varchar", "gt", "string0", 100),
    ("numeric", "gt", 50, 50),
    ("date", "gt", "2000-01-01", 99),
    # lt
    # ("varchar", "lt", "stringA", 100),
    # ("numeric", "lt", 51, 50),
    # ("date", "lt", "2099-01-01", 99),
    # ge
    # ("varchar", "ge", "string1", 100),
    # ("numeric", "ge", 50, 51),
    # ("date", "ge", "2000-01-01", 100),
    # le
    # ("varchar", "le", "string2", 13),
    # ("numeric", "le", 51, 51),
    # ("date", "le", "2099-01-01", 100),
    # like
    # ("varchar", "like", "%1", 10),
    # ilike
    # ("varchar", "ilike", "STRING1%", 12),
    # not_ilike
    # ("varchar", "not_ilike", "STRING1%", 88),
    # in
    # ("varchar", "in", ["string1", "string2", "string3"], 3),
    # ("numeric", "in", [1, 2, 3], 3),
    # not_in
    # ("varchar", "not_in", ["string1", "string2", "string3"], 97),
    # ("numeric", "not_in", [1, 2, 3], 97),
    # any
    # ("array", "any", 1, 1),
    # not_any
    # ("array", "not_any", 1, 99),
]


@pytest.mark.parametrize("field,op,value,res_len", ops_test_list)
def test_filter_with_db_functions(
    filter_sort_table_obj, field, op, value, res_len
):
    table, engine = filter_sort_table_obj

    db_function_lambda = database_functions[op]

    if value:
        db_function = db_function_lambda(field, value)
    else:
        db_function = db_function_lambda(field)

    relation = table.select()

    query = apply_db_function_as_filter(relation, db_function)

    record_list = execute_query(engine, query)

    if field == "date" and value is not None:
        value = datetime.strptime(value, "%Y-%m-%d").date()
    elif field == "array" and value is not None and op not in ["any", "not_any"]:
        value = [int(c) for c in value[1:-1].split(",")]

    assert len(record_list) == res_len
    for record in record_list:
        val_func = op_to_python_func[op]
        assert val_func(getattr(record, field), value)
