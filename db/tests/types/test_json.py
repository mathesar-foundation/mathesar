from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy.exc import IntegrityError
from db.types.custom import json_array
from db.utils import execute_pg_query
from db.functions.base import ColumnName, Literal, sa_call_sql_function
from db.functions.operations.apply import apply_db_function_as_filter

@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (json_array.LengthEquals, 0, 1),
    (json_array.LengthEquals, 3, 11),
    (json_array.LengthEquals, 4, 1),
    (json_array.LengthEquals,6, 1),
])
def test_json_array_filter_functions(json_table_obj, main_db_function, literal_param, expected_count):
    table, engine = json_table_obj
    selectable = table.select()
    json_column_name = "json_array"
    db_function = main_db_function([
        ColumnName([json_column_name]),
        Literal([literal_param]),
    ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_pg_query(engine, query)
    assert len(record_list) == expected_count