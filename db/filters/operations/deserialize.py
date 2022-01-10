from db.filters.base import (
    Expression, supported_expressions, UnknownPredicateType, BadFilterFormat,
)


def get_expression_from_MA_filter_spec(spec: dict) -> Expression:
    def _deserialize_parameter_if_necessary(parameter):
        if isinstance(parameter, dict):
            return get_expression_from_MA_filter_spec(parameter)
        else:
            return parameter
    try:
        expression_subclass_id = _get_first_dict_key(spec)
        expression_subclass = _get_expression_subclass_by_id(expression_subclass_id)
        raw_parameters = spec[expression_subclass_id]
        assert isinstance(raw_parameters, list)
        parameters = [
            _deserialize_parameter_if_necessary(raw_parameter)
            for raw_parameter in raw_parameters
        ]
        return expression_subclass(parameters=parameters)
    except (TypeError, KeyError) as e:
        # Raised when the objects in the spec don't have the right fields (e.g. column or parameter).
        raise BadFilterFormat from e


def _get_expression_subclass_by_id(subclass_id):
    for expression_subclass in supported_expressions:
        if expression_subclass.id == subclass_id:
            return expression_subclass
    raise UnknownPredicateType


def _get_first_dict_key(dict):
    return next(iter(dict))
