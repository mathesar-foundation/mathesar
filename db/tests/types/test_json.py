import pytest
from db.types.custom import json_array, json_object
from db.utils import execute_pg_query
from db.functions.base import ColumnName, Literal, Noop
from db.functions.operations.apply import apply_db_function_as_filter


@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (json_array.JsonLengthEquals, 0, 1),
    (json_array.JsonLengthEquals, 3, 11),
    (json_array.JsonLengthEquals, 4, 1),
    (json_array.JsonLengthEquals, 6, 1),
    (json_array.JsonLengthGreaterThan, 3, 2),
    (json_array.JsonLengthGreaterorEqual, 3, 13),
    (json_array.JsonLengthLessThan, 4, 12),
    (json_array.JsonLengthLessorEqual, 4, 13),
    (json_array.JsonLengthGreaterorEqual, 4, 2),
    (json_array.JsonArrayContains, [1, 2, 3], 1),
    (json_array.JsonArrayContains, ["Ford", "BMW"], 6),
    (json_array.JsonArrayContains, ["BMW", "Ford", "Fiat", "Fiat"], 3),
    (json_array.JsonNotEmpty, '', 13),
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


@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (json_object.JsonObjectContains, '{"name": "John"}', 5),
    (json_object.JsonObjectNotContains, '{"name": "John"}', 9),
    (json_object.JsonObjectExistsKey, 'name', 12),
    (json_object.JsonObjectNotExistsKey, 'name', 2),
    (json_object.JsonObjectLengthEquals, 3, 2),
])
def test_json_object_filter_functions(json_table_obj, main_db_function, literal_param, expected_count):
    table, engine = json_table_obj
    selectable = table.select()
    json_column_name = "json_object"
    db_function = main_db_function([
        ColumnName([json_column_name]),
        Literal([literal_param]),
    ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_pg_query(engine, query)
    assert len(record_list) == expected_count