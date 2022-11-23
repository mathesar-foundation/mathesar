import pytest
from db.utils import execute_pg_query
from db.functions.base import ColumnName, Noop, ArrayContains
from db.functions.packed import (
    ArrayLengthEquals, ArrayLengthGreaterThan, ArrayLengthGreaterorEqual,
    ArrayLengthLessThan, ArrayLengthLessorEqual, ArrayNotEmpty
)
from db.functions.operations.apply import apply_db_function_as_filter


@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (ArrayLengthEquals, 0, 1),
    (ArrayLengthEquals, 3, 11),
    (ArrayLengthEquals, 4, 1),
    (ArrayLengthEquals, 6, 1),
    (ArrayLengthGreaterThan, 3, 2),
    (ArrayLengthGreaterorEqual, 3, 13),
    (ArrayLengthLessThan, 4, 12),
    (ArrayLengthLessorEqual, 4, 13),
    (ArrayLengthGreaterorEqual, 4, 2),
    (ArrayContains, [1, 2, 3], 1),
    (ArrayContains, ["Ford", "BMW"], 6),
    (ArrayContains, ["BMW", "Ford", "Fiat", "Fiat"], 3),
    (ArrayNotEmpty, '', 13),
])

@pytest.mark.skip("")
def test_array_filter_functions(array_table_obj, main_db_function, literal_param, expected_count):
    table, engine = array_table_obj
    selectable = table.select()
    array_column_name = "array_col"
    db_function = main_db_function([
        ColumnName([array_column_name]),
        Noop([literal_param]),
    ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_pg_query(engine, query)
    assert len(record_list) == expected_count
