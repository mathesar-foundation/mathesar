from ..base import DbFunction, supported_db_functions
from ..exceptions import UnknownDbFunctionId, BadDbFunctionFormat


def get_db_function_from_ma_function_spec(spec: dict) -> DbFunction:
    def _deserialize_parameter_if_necessary(parameter):
        if isinstance(parameter, dict):
            return get_db_function_from_ma_function_spec(parameter)
        else:
            return parameter
    try:
        db_function_subclass_id = _get_first_dict_key(spec)
        db_function_subclass = _get_db_function_subclass_by_id(db_function_subclass_id)
        raw_parameters = spec[db_function_subclass_id]
        assert isinstance(raw_parameters, list)
        parameters = [
            _deserialize_parameter_if_necessary(raw_parameter)
            for raw_parameter in raw_parameters
        ]
        return db_function_subclass(parameters=parameters)
    except (TypeError, KeyError) as e:
        # Raised when the objects in the spec don't have the right fields (e.g. column or parameter).
        raise BadDbFunctionFormat from e


def _get_db_function_subclass_by_id(subclass_id):
    for db_function_subclass in supported_db_functions:
        if db_function_subclass.id == subclass_id:
            return db_function_subclass
    raise UnknownDbFunctionId


def _get_first_dict_key(dict):
    return next(iter(dict))
