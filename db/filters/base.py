from dataclasses import dataclass, field#, replace
from enum import Enum
from typing import Any, List, Union

class OperatorPredicateType(Enum):
    NOT = "not"
    OR = "or"
    AND = "and"

class PrimitivePredicateType(Enum):
    """Note that negation is achieved via OperatorPredicateType.NOT"""
    EQUAL = "equal"
    GREATER = "greater"
    GREATER_OR_EQUAL = "greater_or_equal"
    LESSER = "lesser"
    LESSER_OR_EQUAL = "lesser_or_equal"
    EMPTY = "empty"
    IN = "in"

predicateTypesToSAIds = {
    OperatorPredicateType.NOT: 'not',
    OperatorPredicateType.AND: 'and',
    OperatorPredicateType.OR: 'or',
    PrimitivePredicateType.EQUAL: 'eq',
    PrimitivePredicateType.GREATER: 'gt',
    PrimitivePredicateType.GREATER_OR_EQUAL: 'ge',
    PrimitivePredicateType.LESSER: 'lt',
    PrimitivePredicateType.LESSER_OR_EQUAL: 'le',
    PrimitivePredicateType.EMPTY: 'is_null',
    PrimitivePredicateType.IN: 'in',
}

def getSAIdFromPredicateType(type: Union[PrimitivePredicateType, OperatorPredicateType]) -> str:
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
    type: Union[PrimitivePredicateType, OperatorPredicateType]

    def saId(self) -> str:
        return getSAIdFromPredicateType(self.type)

@frozen_dataclass
class PrimitivePredicate(Predicate):
    type: PrimitivePredicateType
    field: str 

@frozen_dataclass
class OperatorPredicate(Predicate):
    type: OperatorPredicateType

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
class Equal(PrimitivePredicate, HasParameter):
    type: PrimitivePredicateType = field(init=False, default=PrimitivePredicateType.EQUAL)

@frozen_dataclass
class Empty(PrimitivePredicate):
    type: PrimitivePredicateType = field(init=False, default=PrimitivePredicateType.EMPTY)

@frozen_dataclass
class Not(OperatorPredicate, SingleSubject):
    type: OperatorPredicateType = field(init=False, default=OperatorPredicateType.NOT)

@frozen_dataclass
class And(OperatorPredicate, MultiSubject):
    type: OperatorPredicateType = field(init=False, default=OperatorPredicateType.AND)

def getSASpecFromPredicate(pred: Predicate) -> dict:
    if isinstance(pred, PrimitivePredicate):
        if isinstance(pred, HasParameter):
            return {'field': pred.field, 'op': pred.saId(), 'value': pred.parameter}
        else:
            return {'field': pred.field, 'op': pred.saId()}
    elif isinstance(pred, OperatorPredicateType):
        if isinstance(pred, SingleSubject):
            subject = getSASpecFromPredicate(pred.subject)
            return {pred.saId(): [subject]}
        if isinstance(pred, MultiSubject):
            subjects = [ getSASpecFromPredicate(subject) for subject in pred.subjects ]
            return {pred.saId(): subjects}
        else:
            raise Exception("This should never happen.")
    else:
        raise Exception("This should never happen.")
