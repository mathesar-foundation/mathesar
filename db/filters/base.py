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

class BranchType(Enum):
    SINGLE = "single"
    MULTI = "multi"

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
    LIST = "list"

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

@frozen_dataclass
class Predicate:
    superType: PredicateSuperType
    type: Union[LeafPredicateType, BranchPredicateType]

    def saId(self) -> str:
        return getSAIdFromPredicateType(self.type)

@frozen_dataclass
class LeafPredicate(Predicate):
    superType: PredicateSuperType = field(init=False, default=PredicateSuperType.LEAF)
    type: LeafPredicateType
    parameterType: ParameterType
    field: str 

@frozen_dataclass
class BranchPredicate(Predicate):
    superType: PredicateSuperType = field(init=False, default=PredicateSuperType.BRANCH)
    type: BranchPredicateType
    branchType: BranchType

@frozen_dataclass
class SingleBranch:
    branchType: BranchType = field(init=False, default=BranchType.SINGLE)
    subject: Predicate

@frozen_dataclass
class MultiBranch:
    branchType: BranchType = field(init=False, default=BranchType.MULTI)
    subjects: List[Predicate]

@frozen_dataclass
class TakesSingleParameter:
    parameterType: ParameterType = field(init=False, default=ParameterType.SINGLE)
    parameter: Any

@frozen_dataclass
class TakesListParameter:
    parameterType: ParameterType = field(init=False, default=ParameterType.LIST)
    parameters: List[Any]

@frozen_dataclass
class Equal(LeafPredicate, TakesSingleParameter):
    type: LeafPredicateType = field(init=False, default=LeafPredicateType.EQUAL)

@frozen_dataclass
class Empty(LeafPredicate):
    type: LeafPredicateType = field(init=False, default=LeafPredicateType.EMPTY)

@frozen_dataclass
class In(LeafPredicate, TakesListParameter):
    type: LeafPredicateType = field(init=False, default=LeafPredicateType.IN)

@frozen_dataclass
class Not(BranchPredicate, SingleBranch):
    type: BranchPredicateType = field(init=False, default=BranchPredicateType.NOT)

@frozen_dataclass
class And(BranchPredicate, MultiBranch):
    type: BranchPredicateType = field(init=False, default=BranchPredicateType.AND)

def getSAFilterSpecFromPredicate(pred: Predicate) -> dict:
    if isinstance(pred, LeafPredicate):
        if isinstance(pred, TakesSingleParameter):
            return {'field': pred.field, 'op': pred.saId(), 'value': pred.parameter}
        else:
            return {'field': pred.field, 'op': pred.saId()}
    elif isinstance(pred, BranchPredicateType):
        if isinstance(pred, SingleBranch):
            subject = getSAFilterSpecFromPredicate(pred.subject)
            return {pred.saId(): [subject]}
        if isinstance(pred, MultiBranch):
            subjects = [ getSAFilterSpecFromPredicate(subject) for subject in pred.subjects ]
            return {pred.saId(): subjects}
        else:
            raise Exception("This should never happen.")
    else:
        raise Exception("This should never happen.")

def getMAFilterSpecFromPredicate(pred: Predicate) -> dict:
    spec = { 'superType': pred.superType, 'type': pred.type, }
    if isinstance(pred, LeafPredicate):
        spec['parameterType'] = pred.parameterType
    if isinstance(pred, BranchPredicate):
        spec['branchType'] = pred.branchType
    return spec
