from db.functions.operations.deserialize import get_db_function_from_MA_filter_spec
from db.functions.operations.filter import filter_with_db_function


def apply_ma_filter_spec(query, ma_filter_spec: dict):
    db_function = get_db_function_from_MA_filter_spec(ma_filter_spec)
    query = filter_with_db_function(query, db_function)
    return query


