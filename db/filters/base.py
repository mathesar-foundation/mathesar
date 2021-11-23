from dataclasses import dataclass, field#, replace
from enum import Enum
from typing import Any, List, Union

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
    type: Union[LeafPredicateType, BranchPredicateType]

    def saId(self) -> str:
        return getSAIdFromPredicateType(self.type)

@frozen_dataclass
class LeafPredicate(Predicate):
    type: LeafPredicateType
    field: str 

@frozen_dataclass
class BranchPredicate(Predicate):
    type: BranchPredicateType

@frozen_dataclass
class SingleSubject:
    subject: Predicate

@frozen_dataclass
class MultiSubject:
    subjects: List[Predicate]

@frozen_dataclass
class HasParameter:
    parameter: Any

@frozen_dataclass
class Equal(LeafPredicate, HasParameter):
    type: LeafPredicateType = field(init=False, default=LeafPredicateType.EQUAL)

@frozen_dataclass
class Empty(LeafPredicate):
    type: LeafPredicateType = field(init=False, default=LeafPredicateType.EMPTY)

@frozen_dataclass
class Not(BranchPredicate, SingleSubject):
    type: BranchPredicateType = field(init=False, default=BranchPredicateType.NOT)

@frozen_dataclass
class And(BranchPredicate, MultiSubject):
    type: BranchPredicateType = field(init=False, default=BranchPredicateType.AND)

def getSAFilterSpecFromPredicate(pred: Predicate) -> dict:
    if isinstance(pred, LeafPredicate):
        if isinstance(pred, HasParameter):
            return {'field': pred.field, 'op': pred.saId(), 'value': pred.parameter}
        else:
            return {'field': pred.field, 'op': pred.saId()}
    elif isinstance(pred, BranchPredicateType):
        if isinstance(pred, SingleSubject):
            subject = getSAFilterSpecFromPredicate(pred.subject)
            return {pred.saId(): [subject]}
        if isinstance(pred, MultiSubject):
            subjects = [ getSAFilterSpecFromPredicate(subject) for subject in pred.subjects ]
            return {pred.saId(): subjects}
        else:
            raise Exception("This should never happen.")
    else:
        raise Exception("This should never happen.")
