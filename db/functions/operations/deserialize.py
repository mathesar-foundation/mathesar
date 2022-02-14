from db.functions.base import DBFunction, Literal, ColumnReference
from db.functions.known_db_functions import known_db_functions
from db.functions.exceptions import UnknownDBFunctionId, BadDBFunctionFormat


def get_db_function_from_ma_function_spec(spec: dict) -> DBFunction:
    try:
        db_function_subclass_id = _get_first_dict_key(spec)
        db_function_subclass = _get_db_function_subclass_by_id(db_function_subclass_id)
        raw_parameters = spec[db_function_subclass_id]
        if not isinstance(raw_parameters, list):
            raise BadDBFunctionFormat(
                "The value in the function's key-value pair must be a list."
            )
        parameters = [
            _process_parameter(
                parameter=raw_parameter,
                parent_db_function_subclass=db_function_subclass
            )
            for raw_parameter in raw_parameters
        ]
        return db_function_subclass(parameters=parameters)
    except (TypeError, KeyError) as e:
        raise BadDBFunctionFormat from e


def _process_parameter(parameter, parent_db_function_subclass):
    if isinstance(parameter, dict):
        # A dict parameter is a nested function call.
        return get_db_function_from_ma_function_spec(parameter)
    elif (
        parent_db_function_subclass is Literal
        or parent_db_function_subclass is ColumnReference
    ):
        # Everything except for a dict is considered a literal parameter.
        # And, only the Literal and ColumnReference DBFunctions can have a literal parameter.
        return parameter
    else:
        raise BadDBFunctionFormat(
            "A literal must be specified as such by wrapping it in the literal function."
        )


def _get_db_function_subclass_by_id(subclass_id):
    for db_function_subclass in known_db_functions:
        if db_function_subclass.id == subclass_id:
            return db_function_subclass
    raise UnknownDBFunctionId


def _get_first_dict_key(dict):
    return next(iter(dict))
