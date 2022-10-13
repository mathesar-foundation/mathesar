import pytest
from db.utils import execute_pg_query
from db.functions.base import ColumnName, Noop, JsonArrayContains
from db.functions.packed import (
    JsonLengthEquals, JsonLengthGreaterThan, JsonLengthGreaterorEqual,
    JsonLengthLessThan, JsonLengthLessorEqual, JsonNotEmpty
)
from db.functions.operations.apply import apply_db_function_as_filter


@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (JsonLengthEquals, 0, 1),
    (JsonLengthEquals, 3, 11),
    (JsonLengthEquals, 4, 1),
    (JsonLengthEquals, 6, 1),
    (JsonLengthGreaterThan, 3, 2),
    (JsonLengthGreaterorEqual, 3, 13),
    (JsonLengthLessThan, 4, 12),
    (JsonLengthLessorEqual, 4, 13),
    (JsonLengthGreaterorEqual, 4, 2),
    (JsonArrayContains, [1, 2, 3], 1),
    (JsonArrayContains, ["Ford", "BMW"], 6),
    (JsonArrayContains, ["BMW", "Ford", "Fiat", "Fiat"], 3),
    (JsonNotEmpty, '', 13),
])
def test_json_array_filter_functions(json_table_obj, main_db_function, literal_param, expected_count):
    table, engine = json_table_obj
    selectable = table.select()
    json_column_name = "json_array"
    db_function = main_db_function([
        ColumnName([json_column_name]),
        Noop([literal_param]),
    ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_pg_query(engine, query)
    assert len(record_list) == expected_count
