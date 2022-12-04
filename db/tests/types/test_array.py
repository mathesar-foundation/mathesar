import pytest
from db.utils import execute_pg_query
from db.functions.base import ColumnName, Noop, ArrayContains
from db.functions.packed import (
    ArrayLengthEquals, ArrayLengthGreaterThan, ArrayLengthGreaterOrEqual,
    ArrayLengthLessThan, ArrayLengthLessOrEqual, ArrayNotEmpty
)
from db.functions.operations.apply import apply_db_function_as_filter


@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (ArrayLengthEquals, 0, 1),
    (ArrayLengthEquals, 3, 9),
    (ArrayLengthEquals, 5, 1),
    (ArrayLengthEquals, 2, 1),
    (ArrayLengthGreaterThan, 3, 1),
    (ArrayLengthGreaterOrEqual, 3, 10),
    (ArrayLengthLessThan, 4, 11),
    (ArrayLengthLessOrEqual, 5, 12),
    (ArrayLengthGreaterOrEqual, 5, 1),
    (ArrayContains, {1, 2, 3}, 1),
    (ArrayContains, {1}, 8),
    (ArrayContains, {4, 1}, 4),
    (ArrayNotEmpty, {}, 11),
])
def test_filter_functions_on_int_array(array_table_obj, main_db_function, literal_param, expected_count):
    table, engine = array_table_obj
    selectable = table.select()
    dimension = 1
    array_column_name = "int_array_col"
    if main_db_function is ArrayContains:
        db_function = main_db_function([
            ColumnName([array_column_name]),
            Noop([literal_param]),
        ])
    else:
        # The db_func dependent on array_length(array, dimension) requires 2 paramters
        db_function = main_db_function([
            ColumnName([array_column_name]),
            Noop([dimension]),
            Noop([literal_param]),
        ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_pg_query(engine, query)
    assert len(record_list) == expected_count


@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (ArrayLengthEquals, 0, 1),
    (ArrayLengthEquals, 3, 8),
    (ArrayLengthEquals, 5, 1),
    (ArrayLengthEquals, 6, 1),
    (ArrayLengthGreaterThan, 3, 3),
    (ArrayLengthGreaterOrEqual, 3, 11),
    (ArrayLengthLessThan, 4, 9),
    (ArrayLengthLessOrEqual, 5, 11),
    (ArrayLengthGreaterOrEqual, 5, 2),
    (ArrayContains, {'Tesla'}, 1),
    (ArrayContains, {'Ford', 'BMW'}, 3),
    (ArrayNotEmpty, {}, 11),
])
def test_filter_functions_on_text_array(array_table_obj, main_db_function, literal_param, expected_count):
    table, engine = array_table_obj
    selectable = table.select()
    dimension = 1
    array_column_name = "text_array_col"
    if main_db_function is ArrayContains:
        db_function = main_db_function([
            ColumnName([array_column_name]),
            Noop([literal_param]),
        ])
    else:
        # The db_func dependent on array_length(array, dimension) requires 2 paramters
        db_function = main_db_function([
            ColumnName([array_column_name]),
            Noop([dimension]),
            Noop([literal_param]),
        ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_pg_query(engine, query)
    assert len(record_list) == expected_count
