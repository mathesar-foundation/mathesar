from mathesar.database.functions.base import Function, supported_db_functions
from db.filters.base import UnknownPredicateType, BadFilterFormat


def get_db_function_from_MA_filter_spec(spec: dict) -> Function:
    def _deserialize_parameter_if_necessary(parameter):
        if isinstance(parameter, dict):
            return get_db_function_from_MA_filter_spec(parameter)
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
        raise BadFilterFormat from e


def _get_db_function_subclass_by_id(subclass_id):
    for db_function_subclass in supported_db_functions:
        if db_function_subclass.id == subclass_id:
            return db_function_subclass
    raise UnknownPredicateType


def _get_first_dict_key(dict):
    return next(iter(dict))
