from typing import Any
from db.filters.base import (
    Predicate, Leaf, SingleParameter, MultiParameter, NoParameter, Branch, get_predicate_subclass_by_type_str, BadFilterFormat
)


def get_predicate_from_MA_filter_spec(spec: dict) -> Predicate:
    def get_first_dict_key(dict: dict) -> Any:
        return next(iter(dict))
    if not isinstance(spec, dict):
        raise BadFilterFormat("Parsing of Mathesar filter specification failed.")
    try:
        predicate_type_str = get_first_dict_key(spec)
        predicate_subclass = get_predicate_subclass_by_type_str(predicate_type_str)
        predicate_body = spec[predicate_type_str]
        if issubclass(predicate_subclass, Leaf):
            columnName = predicate_body['column']
            if issubclass(predicate_subclass, SingleParameter):
                return predicate_subclass(column=columnName, parameter=predicate_body['parameter'])
            elif issubclass(predicate_subclass, MultiParameter):
                return predicate_subclass(column=columnName, parameters=predicate_body['parameters'])
            elif issubclass(predicate_subclass, NoParameter):
                return predicate_subclass(column=columnName)
            else:
                raise Exception("This should never happen.")
        elif issubclass(predicate_subclass, Branch):
            if issubclass(predicate_subclass, SingleParameter):
                parameter_predicate = get_predicate_from_MA_filter_spec(predicate_body)
                return predicate_subclass(parameter=parameter_predicate)
            elif issubclass(predicate_subclass, MultiParameter):
                parameter_predicates = \
                    [get_predicate_from_MA_filter_spec(parameter) for parameter in predicate_body]
                return predicate_subclass(parameters=parameter_predicates)
            else:
                raise Exception("This should never happen.")
        else:
            raise Exception("This should never happen.")
    except (TypeError, KeyError) as e:
        # Raised when the objects in the spec don't have the right fields (e.g. column or parameter).
        raise BadFilterFormat from e
