from dataclasses import dataclass, field#, replace
from enum import Enum
from typing import Any, List, Union

class PredicateSuperType(Enum):
    LEAF = "leaf"
    BRANCH = "branch"

class BranchPredicateType(Enum):
    NOT = "not"
    OR = "or"
    AND = "and"

class LeafPredicateType(Enum):
    """Note that negation is achieved via BranchPredicateType.NOT"""
    EQUAL = "equal"
    GREATER = "greater"
    GREATER_OR_EQUAL = "greater_or_equal"
    LESSER = "lesser"
    LESSER_OR_EQUAL = "lesser_or_equal"
    EMPTY = "empty"
    IN = "in"

class ParameterType(Enum):
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
# TODO add kw_only=True on upgrade to Python 3.10, improves readability and prevents argument order errors
def frozen_dataclass(f):
    return dataclass(frozen=True)(f)

def fauxStatic(value):
    """
    Declares a static field on a dataclass.
    """
    return field(init=False, default=value)

@frozen_dataclass
class Predicate:
    superType: PredicateSuperType
    type: Union[LeafPredicateType, BranchPredicateType]
    parameterType: ParameterType

    def saId(self) -> str:
        return getSAIdFromPredicateType(self.type)

@frozen_dataclass
class Leaf(Predicate):
    superType: PredicateSuperType = fauxStatic(PredicateSuperType.LEAF)
    type: LeafPredicateType
    field: str 

@frozen_dataclass
class SingleParameter:
    parameterType: ParameterType = fauxStatic(ParameterType.SINGLE)
    parameter: Any

@frozen_dataclass
class MultiParameter:
    parameterType: ParameterType = fauxStatic(ParameterType.MULTI)
    parameters: List[Any]

@frozen_dataclass
class NoParameter:
    parameterType: ParameterType = fauxStatic(ParameterType.NONE)

@frozen_dataclass
class Branch(Predicate):
    superType: PredicateSuperType = fauxStatic(PredicateSuperType.BRANCH)
    type: BranchPredicateType

@frozen_dataclass
class Equal(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = fauxStatic(LeafPredicateType.EQUAL)

@frozen_dataclass
class Greater(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = fauxStatic(LeafPredicateType.GREATER)

@frozen_dataclass
class GreaterOrEqual(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = fauxStatic(LeafPredicateType.GREATER_OR_EQUAL)

@frozen_dataclass
class Lesser(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = fauxStatic(LeafPredicateType.LESSER)

@frozen_dataclass
class LesserOrEqual(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = fauxStatic(LeafPredicateType.LESSER_OR_EQUAL)

@frozen_dataclass
class Empty(NoParameter, Leaf, Predicate):
    type: LeafPredicateType = fauxStatic(LeafPredicateType.EMPTY)

@frozen_dataclass
class In(MultiParameter, Leaf, Predicate):
    type: LeafPredicateType = fauxStatic(LeafPredicateType.IN)

@frozen_dataclass
class Not(SingleParameter, Branch, Predicate):
    type: BranchPredicateType = fauxStatic(BranchPredicateType.NOT)

@frozen_dataclass
class And(MultiParameter, Branch, Predicate):
    type: BranchPredicateType = fauxStatic(BranchPredicateType.AND)

@frozen_dataclass
class Or(MultiParameter, Branch, Predicate):
    type: BranchPredicateType = fauxStatic(BranchPredicateType.OR)

def getSAFilterSpecFromPredicate(pred: Predicate) -> dict:
    if isinstance(pred, Leaf):
        if isinstance(pred, SingleParameter):
            return {'field': pred.field, 'op': pred.saId(), 'value': pred.parameter}
        elif isinstance(pred, MultiParameter):
            return {'field': pred.field, 'op': pred.saId(), 'value': pred.parameters}
        elif isinstance(pred, NoParameter):
            return {'field': pred.field, 'op': pred.saId()}
        else:
            raise Exception("This should never happen.")
    elif isinstance(pred, Branch):
        if isinstance(pred, SingleParameter):
            subject = getSAFilterSpecFromPredicate(pred.parameter)
            return {pred.saId(): [subject]}
        elif isinstance(pred, MultiParameter):
            subjects = [ getSAFilterSpecFromPredicate(subject) for subject in pred.parameters ]
            return {pred.saId(): subjects}
        else:
            raise Exception("This should never happen.")
    else:
        raise Exception("This should never happen.")

def getMAFilterSpecFromPredicate(pred: Predicate) -> dict:
    spec = {
        'superType': pred.superType.value,
        'type': pred.type.value,
        'parameterType': pred.parameterType.value,
    }
    return spec
