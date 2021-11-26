from dataclasses import dataclass, field#, replace
from enum import Enum
from typing import Any, List, Union, Type
from sqlalchemy_filters.exceptions import BadFilterFormat as SABadFilterFormat

class PredicateSuperType(Enum):
    LEAF = "leaf"
    BRANCH = "branch"

class BranchPredicateType(Enum):
    NOT = "not"
    OR = "or"
    AND = "and"

# TODO switch to using SA filter names directly
# TODO what to do about duplication https://github.com/centerofci/mathesar/pull/844 ?
class LeafPredicateType(Enum):
    """Note that negation is achieved via BranchPredicateType.NOT"""
    EQUAL = "equal"
    GREATER = "greater"
    GREATER_OR_EQUAL = "greater_or_equal"
    LESSER = "lesser"
    LESSER_OR_EQUAL = "lesser_or_equal"
    EMPTY = "empty"
    IN = "in"

class ParameterCount(Enum):
    SINGLE = "single"
    MULTI = "multi"
    NONE = "none"

predicateTypesToSAIds = {
    BranchPredicateType.NOT: 'not',
    BranchPredicateType.AND: 'and',
    BranchPredicateType.OR: 'or',
    LeafPredicateType.EQUAL: 'eq',
    LeafPredicateType.GREATER: 'gt',
    LeafPredicateType.GREATER_OR_EQUAL: 'ge',
    LeafPredicateType.LESSER: 'lt',
    LeafPredicateType.LESSER_OR_EQUAL: 'le',
    LeafPredicateType.EMPTY: 'is_null',
    LeafPredicateType.IN: 'in',
}

def getSAIdFromPredicateType(type: Union[LeafPredicateType, BranchPredicateType]) -> str:
    if type in predicateTypesToSAIds:
        return predicateTypesToSAIds[type]
    else:
        raise Exception("This should never happen.")

# frozen=True provides immutability
def frozen_dataclass(f):
    return dataclass(frozen=True)(f)

def static(value):
    """
    Declares a static field on a dataclass.
    """
    return field(init=False, default=value)

@frozen_dataclass
class Predicate:
    superType: PredicateSuperType
    type: Union[LeafPredicateType, BranchPredicateType]
    parameterCount: ParameterCount

    def saId(self) -> str:
        return getSAIdFromPredicateType(self.type)

    def __post_init__(self):
        assertPredicateCorrect(self)

@frozen_dataclass
class Leaf(Predicate):
    superType: PredicateSuperType = static(PredicateSuperType.LEAF)
    type: LeafPredicateType
    column: str 

@frozen_dataclass
class SingleParameter:
    parameterCount: ParameterCount = static(ParameterCount.SINGLE)
    parameter: Any


@frozen_dataclass
class MultiParameter:
    parameterCount: ParameterCount = static(ParameterCount.MULTI)
    parameters: List[Any]

@frozen_dataclass
class NoParameter:
    parameterCount: ParameterCount = static(ParameterCount.NONE)

@frozen_dataclass
class Branch(Predicate):
    superType: PredicateSuperType = static(PredicateSuperType.BRANCH)
    type: BranchPredicateType

@frozen_dataclass
class Equal(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.EQUAL)

@frozen_dataclass
class Greater(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.GREATER)

@frozen_dataclass
class GreaterOrEqual(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.GREATER_OR_EQUAL)

@frozen_dataclass
class Lesser(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.LESSER)

@frozen_dataclass
class LesserOrEqual(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.LESSER_OR_EQUAL)

@frozen_dataclass
class Empty(NoParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.EMPTY)

@frozen_dataclass
class In(MultiParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.IN)

@frozen_dataclass
class Not(SingleParameter, Branch, Predicate):
    type: BranchPredicateType = static(BranchPredicateType.NOT)

@frozen_dataclass
class And(MultiParameter, Branch, Predicate):
    type: BranchPredicateType = static(BranchPredicateType.AND)

@frozen_dataclass
class Or(MultiParameter, Branch, Predicate):
    type: BranchPredicateType = static(BranchPredicateType.OR)

def getPredicateSubClassByTypeStr(predicateTypeStr: str) -> Union[Type[LeafPredicateType], Type[BranchPredicateType]]:
    for subClass in allPredicateSubClasses:
        if subClass.type.value == predicateTypeStr:
            return subClass
    raise Exception(f'Unknown predicate type: {predicateTypeStr}')


class BadFilterFormat(SABadFilterFormat):
    pass


allPredicateSubClasses = [
    Equal,
    Greater,
    GreaterOrEqual,
    Lesser,
    LesserOrEqual,
    Empty,
    In,
    Not,
    And,
    Or,
]

def takesParameterThatsAMathesarType(predicateSubClass: Type[Predicate]) -> bool:
    return (
        issubclass(predicateSubClass, Leaf)
        and not issubclass(predicateSubClass, NoParameter)
    )

def not_empty(l): return len(l) > 0

def assertPredicateCorrect(predicate):
    try:
        if isinstance(predicate, Leaf):
            column = predicate.column
            columnNameValid = column is not None and type(column) is str and column != ""
            assert columnNameValid

        if isinstance(predicate, SingleParameter):
            parameter = predicate.parameter
            assert parameter is not None
            isParameterList = isinstance(parameter, list)
            assert not isParameterList
            isParameterPredicate = isinstance(parameter, Predicate)
            if isinstance(predicate, Leaf):
                assert not isParameterPredicate
            elif isinstance(predicate, Branch):
                assert isParameterPredicate
        elif isinstance(predicate, MultiParameter):
            parameters = predicate.parameters
            assert parameters is not None
            isParameterList = isinstance(parameters, list)
            assert isParameterList
            assert not_empty(parameters)
            areParametersPredicates = (
                isinstance(parameter, Predicate) for parameter in parameters
            )
            if isinstance(predicate, Leaf):
                noneOfParametersArePredicates = not any(areParametersPredicates)
                assert noneOfParametersArePredicates
            elif isinstance(predicate, Branch):
                allParametersArePredicates = all(areParametersPredicates)
                assert allParametersArePredicates
    except AssertionError as err:
        raise BadFilterFormat from err
