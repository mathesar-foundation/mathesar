import pytest
from db.functions.exceptions import UnknownDBFunctionId, BadDBFunctionFormat
from db.functions.operations.deserialize import get_db_function_from_ma_function_spec


exceptions_test_list = [
    (
        {"non_existent_fn": [
            {"column_reference": ["varchar"]},
            {"literal": ["test"]},
        ]},
        UnknownDBFunctionId
    ),
    (
        {"empty":
            {"column_reference": ["varchar"]},
        },
        BadDBFunctionFormat
    ),
]


@pytest.mark.parametrize("filter,exception", exceptions_test_list)
def test_get_records_filters_exceptions(filter, exception):
    with pytest.raises(exception):
        get_db_function_from_ma_function_spec(filter)
