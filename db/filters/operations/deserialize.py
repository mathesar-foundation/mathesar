from typing import Any
from db.filters.base import (
    Predicate, Leaf, SingleParameter, MultiParameter, NoParameter, Branch, get_predicate_subclass_by_id_str, BadFilterFormat
)


def get_predicate_from_MA_filter_spec(spec: dict) -> Predicate:
    def get_first_dict_key(dict: dict) -> Any:
        return next(iter(dict))
    if not isinstance(spec, dict):
        raise BadFilterFormat("Parsing of Mathesar filter specification failed.")
    predicate_id_str = get_first_dict_key(spec)
    try:
        predicate_subclass = get_predicate_subclass_by_id_str(predicate_id_str)
        predicate_body = spec[predicate_id_str]
        if issubclass(predicate_subclass, Leaf):
            return predicate_subclass(**predicate_body)
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

