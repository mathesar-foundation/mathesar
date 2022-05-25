from db.functions.base import Literal, ColumnName
from db.functions.known_db_functions import known_db_functions
from db.functions.exceptions import UnknownDBFunctionID, BadDBFunctionFormat


def get_db_function_from_ma_function_spec(spec):
    """
    Expects a db function specification in the following format:

    ```
    {"and": [
        {"empty": [
            {"column_name": ["some_column"]},
        ]},
        {"equal": [
            {"to_lowercase": [
                {"column_name": ["some_string_like_column"]},
            ]},
            {"literal": ["some_string_literal"]},
        ]},
    ]}
    ```

    Every serialized DBFunction is a dict containing one key-value pair. The key is the DBFunction
    id, and the value is always a list of parameters.
    """
    try:
        db_function_subclass_id, raw_parameters = get_raw_spec_components(spec)
        db_function_subclass = get_db_function_subclass_by_id(db_function_subclass_id)
        parameters = [
            _process_parameter(
                parameter=raw_parameter,
                parent_db_function_subclass=db_function_subclass,
            )
            for raw_parameter in raw_parameters
        ]
        db_function = db_function_subclass(parameters=parameters)
        return db_function
    except (TypeError, KeyError) as e:
        raise BadDBFunctionFormat from e


def _process_parameter(parameter, parent_db_function_subclass):
    if isinstance(parameter, dict):
        # A dict parameter is a nested function call.
        return get_db_function_from_ma_function_spec(parameter)
    elif (
        parent_db_function_subclass is Literal
        or parent_db_function_subclass is ColumnName
    ):
        # Everything except for a dict is considered a literal parameter,
        # and only the Literal and ColumnName DBFunctions can have
        # a literal parameter.
        return parameter
    else:
        raise BadDBFunctionFormat(
            "A literal must be specified as such by wrapping it in the literal function."
        )


def get_db_function_subclass_by_id(subclass_id):
    for db_function_subclass in known_db_functions:
        if db_function_subclass.id == subclass_id:
            return db_function_subclass
    raise UnknownDBFunctionID(
        f"DBFunction subclass with id {subclass_id} not found (or not"
        + "available on this DB)."
    )


def get_raw_spec_components(spec):
    db_function_subclass_id = _get_first_dict_key(spec)
    raw_parameters = spec[db_function_subclass_id]
    if not isinstance(raw_parameters, list):
        raise BadDBFunctionFormat(
            "The value in the function's key-value pair must be a list."
        )
    return db_function_subclass_id, raw_parameters


def _get_first_dict_key(dict):
    return next(iter(dict))
