from db.functions.base import DBFunction, Literal, ColumnID, ColumnReference
from db.functions.known_db_functions import known_db_functions
from db.functions.exceptions import UnknownDBFunctionId, BadDBFunctionFormat


def get_db_function_from_ma_function_spec(spec: dict, column_ids_to_names=None) -> DBFunction:
    """
    Expects a db function specification in the following format:

    ```
    {"and": [
        {"empty": [
            {"column_id": ["some_column"]},
        ]},
        {"equal": [
            {"to_lowercase": [
                {"column_id": ["some_string_like_column"]},
            ]},
            {"literal": ["some_string_literal"]},
        ]},
    ]}
    ```

    Every serialized DBFunction is a dict containing one key-value pair. The key is the DBFunction
    id, and the value is always a list of parameters.

    Also takes a mapping of column ids to names, for converting column id references to column name
    references. When converting to an SA expression, only column name references are valid. If
    this mapping is not passed, references are not converted.
    """
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
                parent_db_function_subclass=db_function_subclass,
                column_ids_to_names=column_ids_to_names,
            )
            for raw_parameter in raw_parameters
        ]
        instance = db_function_subclass(parameters=parameters)
        instance = _convert_column_reference_if_necessary(instance, column_ids_to_names)
        return instance
    except (TypeError, KeyError) as e:
        raise BadDBFunctionFormat from e


def _process_parameter(parameter, parent_db_function_subclass, column_ids_to_names):
    if isinstance(parameter, dict):
        # A dict parameter is a nested function call.
        return get_db_function_from_ma_function_spec(parameter, column_ids_to_names)
    elif (
        parent_db_function_subclass is Literal
        or issubclass(parent_db_function_subclass, ColumnReference)
    ):
        # Everything except for a dict is considered a literal parameter.
        # And, only the Literal and ColumnReference (ColumnID and ColumnName) DBFunctions can have
        # a literal parameter.
        return parameter
    else:
        raise BadDBFunctionFormat(
            "A literal must be specified as such by wrapping it in the literal function."
        )


def _convert_column_reference_if_necessary(db_function_instance, column_ids_to_names):
        if column_ids_to_names and isinstance(db_function_instance, ColumnID):
            return db_function_instance.to_column_name(column_ids_to_names)
        else:
            return db_function_instance


def _get_db_function_subclass_by_id(subclass_id):
    for db_function_subclass in known_db_functions:
        if db_function_subclass.id == subclass_id:
            return db_function_subclass
    raise UnknownDBFunctionId(
        f"DBFunction subclass with id {subclass_id} not found (or not"
            +"available on this DB)."
    )


def _get_first_dict_key(dict):
    return next(iter(dict))
