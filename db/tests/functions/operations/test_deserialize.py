import pytest
from db.functions.exceptions import UnknownDBFunctionID, BadDBFunctionFormat
from db.functions.operations.deserialize import get_db_function_from_ma_function_spec


exceptions_test_list = [
    (
        {
            "non_existent_fn": [
                {"column_name": ["varchar"]},
                {"literal": ["test"]},
            ]
        },
        UnknownDBFunctionID
    ),
    (
        {"null": {"column_name": ["varchar"]}, },
        BadDBFunctionFormat
    ),
]


@pytest.mark.parametrize("filter,exception", exceptions_test_list)
def test_get_records_filters_exceptions(filter, exception):
    with pytest.raises(exception):
        get_db_function_from_ma_function_spec(filter)
