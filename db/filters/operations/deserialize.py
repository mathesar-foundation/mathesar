from typing import Any
from db.filters.base import (
    Predicate, Leaf, SingleParameter, MultiParameter, NoParameter, Branch, getPredicateSubClassByTypeStr, BadFilterFormat
)

def getPredicateFromMAFilterSpec(spec: dict) -> Predicate:
    def getFirstDictKey(dict: dict) -> Any:
        return next(iter(dict))
    try:
        assert isinstance(spec, dict)
        predicateTypeStr = getFirstDictKey(spec)
        predicateSubClass = getPredicateSubClassByTypeStr(predicateTypeStr)
        predicateBody = spec[predicateTypeStr]
        if issubclass(predicateSubClass, Leaf):
            columnName = predicateBody['column']
            if issubclass(predicateSubClass, SingleParameter):
                return predicateSubClass(column=columnName, parameter=predicateBody['parameter'])
            elif issubclass(predicateSubClass, MultiParameter):
                return predicateSubClass(column=columnName, parameters=predicateBody['parameters'])
            elif issubclass(predicateSubClass, NoParameter):
                return predicateSubClass(column=columnName)
            else:
                raise Exception("This should never happen.")
        elif issubclass(predicateSubClass, Branch):
            if issubclass(predicateSubClass, SingleParameter):
                parameterPredicate = getPredicateFromMAFilterSpec(predicateBody)
                return predicateSubClass(parameter=parameterPredicate)
            elif issubclass(predicateSubClass, MultiParameter):
                parameterPredicates = \
                    [ getPredicateFromMAFilterSpec(parameter) for parameter in predicateBody ]
                return predicateSubClass(parameters=parameterPredicates)
            else:
                raise Exception("This should never happen.")
        else:
            raise Exception("This should never happen.")
    except:
        raise BadFilterFormat("Parsing of Mathesar filter specification failed.")
