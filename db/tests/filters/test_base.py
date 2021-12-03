import pytest
from db.filters.base import (
    all_predicates, Leaf, Branch, MultiParameter, SingleParameter, NoParameter, Empty, BadFilterFormat
)


def instantiate_subclass(subclass, column=None, parameter=None):
    if issubclass(subclass, Leaf):
        if issubclass(subclass, MultiParameter):
            return subclass(column=column, parameters=parameter)
        elif issubclass(subclass, SingleParameter):
            return subclass(column=column, parameter=parameter)
        elif issubclass(subclass, NoParameter):
            return subclass(column=column)
        else:
            raise Exception("This should never happen")
    elif issubclass(subclass, Branch):
        if issubclass(subclass, MultiParameter):
            return subclass(parameters=parameter)
        elif issubclass(subclass, SingleParameter):
            return subclass(parameter=parameter)
        else:
            raise Exception("This should never happen")
    else:
        raise Exception("This should never happen")


someLeafPredicates = [Empty(column="x"), Empty(column="y"), Empty(column="z")]


parametersSpec = {
    'leaf': {
        'multi': {
            'valid': [[1], [1, 2, 3]],
            'invalid': [1, [], someLeafPredicates[0], [someLeafPredicates[0], someLeafPredicates[1]], None]
        },
        'single': {
            'valid': [1],
            'invalid': [None, [], someLeafPredicates[0]],
        },
    },
    'branch': {
        'multi': {
            'valid': [[someLeafPredicates[0], someLeafPredicates[1]], [someLeafPredicates[0]]],
            'invalid': [[1], [1, 2, 3], [], someLeafPredicates[0], None],
        },
        'single': {
            'valid': [someLeafPredicates[0]],
            'invalid': [None, [], 1],
        },
    },
}


def get_spec_params(predicate_subclass, valid):
    validityKey = 'valid' if valid else 'invalid'
    if issubclass(predicate_subclass, Leaf):
        if issubclass(predicate_subclass, MultiParameter):
            return parametersSpec['leaf']['multi'][validityKey]
        elif issubclass(predicate_subclass, SingleParameter):
            return parametersSpec['leaf']['single'][validityKey]
    elif issubclass(predicate_subclass, Branch):
        if issubclass(predicate_subclass, MultiParameter):
            return parametersSpec['branch']['multi'][validityKey]
        elif issubclass(predicate_subclass, SingleParameter):
            return parametersSpec['branch']['single'][validityKey]
    return []


test_cases = []
for valid in [True, False]:
    for predicate_subclass in all_predicates:
        for param in get_spec_params(predicate_subclass, valid=valid):
            test_cases.append([predicate_subclass, param, valid])


@pytest.mark.parametrize("columnName, valid", [["", False], [None, False], ["col1", True]])
def test_column_name(columnName, valid):
    if valid:
        instantiate_subclass(Empty, columnName)
    else:
        with pytest.raises(BadFilterFormat):
            instantiate_subclass(Empty, columnName)


@pytest.mark.parametrize("predicate_subclass, param, valid", test_cases)
def test_params(predicate_subclass, param, valid):
    validColumnName = "col1"
    if valid:
        instantiate_subclass(predicate_subclass, validColumnName, parameter=param)
    else:
        with pytest.raises(BadFilterFormat):
            instantiate_subclass(predicate_subclass, validColumnName, parameter=param)
