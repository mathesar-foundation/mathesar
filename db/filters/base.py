"""
This module contains Predicate subclasses, and relevenat mixins, that describe nodes in a
predicate tree, or, in other words, predicates that compose into a tree. A predicate is
described by whether it's a Leaf or a Branch, whether it takes parameters and how many
(SingleParameter, MultiParameter, NoParameter) and whether it relies on comparability
(ReliesOnComparability), as well as its identifier and its human-friendly name.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, List, Union, Type
from sqlalchemy_filters.exceptions import BadFilterFormat as SABadFilterFormat
from sqlalchemy import column, not_, and_, or_
from abc import ABC, abstractmethod


class PredicateSuperType(Enum):
    """Every Predicate is either a leaf node in the predicate tree, or a branch node.
    A leaf node (e.g. EMPTY, EQUAL) has no predicate children, while a branch node
    (e.g. AND, OR, NOT) always has predicate children."""
    LEAF = "leaf"
    BRANCH = "branch"


class BranchPredicateType(Enum):
    NOT = "not"
    OR = "or"
    AND = "and"


class LeafPredicateType(Enum):
    """Note that negation is achieved via BranchPredicateType.NOT"""
    EQUAL = "equal"
    NOT_EQUAL = "not_equal"
    GREATER = "greater"
    GREATER_OR_EQUAL = "greater_or_equal"
    LESSER = "lesser"
    LESSER_OR_EQUAL = "lesser_or_equal"
    EMPTY = "empty"
    NOT_EMPTY = "not_empty"
    IN = "in"
    NOT_IN = "not_in"


class ParameterCount(Enum):
    """Predicates (currently only leaf predicates) can take single parameters (e.g. EQUAL
    predicate takes a value to check equality against), lists of parameters (e.g. the IN
    predicate takes a list of values to check membership against), or no paramaters (e.g.
    the EMPTY predicate).""" 
    SINGLE = "single"
    MULTI = "multi"
    NONE = "none"


# frozen=True provides immutability
def frozen_dataclass(f):
    return dataclass(frozen=True)(f)


def static(value):
    """
    Declares a static field on a dataclass.
    """
    return field(init=False, default=value)


@frozen_dataclass
class Predicate(ABC):
    super_type: PredicateSuperType
    type: Union[LeafPredicateType, BranchPredicateType]
    name: str
    parameter_count: ParameterCount

    def __post_init__(self):
        assert_predicate_correct(self)

    @abstractmethod
    def to_sa_filter(self):
        """
        Returns the equivalent SQLAlchemy filter usable as argument to a Query.filter call.
        Not a property, since SA filter's mutability properties are unclear.
        """
        return None

    def apply(self, query):
        return query.filter(self.to_sa_filter())


@frozen_dataclass
class Leaf(Predicate):
    super_type: PredicateSuperType = static(PredicateSuperType.LEAF)
    type: LeafPredicateType
    column: str


@frozen_dataclass
class SingleParameter:
    parameter_count: ParameterCount = static(ParameterCount.SINGLE)
    parameter: Any


@frozen_dataclass
class MultiParameter:
    parameter_count: ParameterCount = static(ParameterCount.MULTI)
    parameters: List[Any]


@frozen_dataclass
class NoParameter:
    parameter_count: ParameterCount = static(ParameterCount.NONE)


@frozen_dataclass
class Branch(Predicate):
    super_type: PredicateSuperType = static(PredicateSuperType.BRANCH)
    type: BranchPredicateType


@frozen_dataclass
class ReliesOnComparability:
    """Some predicates require the data types they are being applied to be comparable
    (lesser, greater, etc.)."""
    pass


def relies_on_comparability(predicate_subclass: Type[Predicate]) -> bool:
    return issubclass(predicate_subclass, ReliesOnComparability)


@frozen_dataclass
class Equal(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.EQUAL)
    name: str = static("Equal")

    def to_sa_filter(self):
        return column(self.column) == self.parameter


@frozen_dataclass
class NotEqual(SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.NOT_EQUAL)
    name: str = static("Not equal")

    def to_sa_filter(self):
        return column(self.column) != self.parameter


@frozen_dataclass
class Greater(ReliesOnComparability, SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.GREATER)
    name: str = static("Greater")

    def to_sa_filter(self):
        return column(self.column) > self.parameter


@frozen_dataclass
class GreaterOrEqual(ReliesOnComparability, SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.GREATER_OR_EQUAL)
    name: str = static("Greater or equal")

    def to_sa_filter(self):
        return column(self.column) >= self.parameter


@frozen_dataclass
class Lesser(ReliesOnComparability, SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.LESSER)
    name: str = static("Lesser")

    def to_sa_filter(self):
        return column(self.column) < self.parameter


@frozen_dataclass
class LesserOrEqual(ReliesOnComparability, SingleParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.LESSER_OR_EQUAL)
    name: str = static("Lesser or equal")

    def to_sa_filter(self):
        return column(self.column) <= self.parameter


@frozen_dataclass
class Empty(NoParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.EMPTY)
    name: str = static("Empty")

    def to_sa_filter(self):
        return column(self.column) == None


@frozen_dataclass
class NotEmpty(NoParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.NOT_EMPTY)
    name: str = static("Not empty")

    def to_sa_filter(self):
        return column(self.column) != None


@frozen_dataclass
class In(MultiParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.IN)
    name: str = static("In")

    def to_sa_filter(self):
        return column(self.column).in_(self.parameters)


@frozen_dataclass
class NotIn(MultiParameter, Leaf, Predicate):
    type: LeafPredicateType = static(LeafPredicateType.NOT_IN)
    name: str = static("Not in")

    def to_sa_filter(self):
        return column(self.column).not_in(self.parameters)


@frozen_dataclass
class Not(SingleParameter, Branch, Predicate):
    type: BranchPredicateType = static(BranchPredicateType.NOT)
    name: str = static("Not")

    def to_sa_filter(self):
        return not_(self.parameter.to_sa_filter())


@frozen_dataclass
class And(MultiParameter, Branch, Predicate):
    type: BranchPredicateType = static(BranchPredicateType.AND)
    name: str = static("And")

    def to_sa_filter(self):
        child_sa_filters = [child_predicate.to_sa_filter() for child_predicate in self.parameters]
        return and_(*child_sa_filters)


@frozen_dataclass
class Or(MultiParameter, Branch, Predicate):
    type: BranchPredicateType = static(BranchPredicateType.OR)
    name: str = static("Or")

    def to_sa_filter(self):
        child_sa_filters = [child_predicate.to_sa_filter() for child_predicate in self.parameters]
        return or_(*child_sa_filters)


def get_predicate_subclass_by_type_str(predicate_type_str: str) -> Union[Type[LeafPredicateType], Type[BranchPredicateType]]:
    for subclass in all_predicates:
        if subclass.type.value == predicate_type_str:
            return subclass
    raise UnknownPredicateType(predicate_type_str)


class BadFilterFormat(SABadFilterFormat):
    pass


class UnknownPredicateType(BadFilterFormat):
    pass


all_predicates = [
    Equal,
    NotEqual,
    Greater,
    GreaterOrEqual,
    Lesser,
    LesserOrEqual,
    Empty,
    NotEmpty,
    In,
    NotIn,
    Not,
    And,
    Or,
]


def _not_empty(xs):
    return len(xs) > 0


def _all_items_unique(xs):
    for item1 in xs:
        times_seen = 0
        for item2 in xs:
            if item1 == item2:
                times_seen += 1
            # A non-duplicate will be seen only once.
            if times_seen == 2:
                return False
    return True


def assert_predicate_correct(predicate):
    """Enforces constraints on predicate instances."""
    try:
        if isinstance(predicate, Leaf):
            column = predicate.column
            column_name_valid = column is not None and type(column) is str and column != ""
            assert column_name_valid, f"Column name invalid: {column}. It must be a non-empty string."

        if isinstance(predicate, SingleParameter):
            parameter = predicate.parameter
            assert parameter is not None, "A parameter must not be None."
            is_parameter_list = isinstance(parameter, list)
            assert not is_parameter_list, "This parameter cannot be a list."
            is_parameter_predicate = isinstance(parameter, Predicate)
            if isinstance(predicate, Leaf):
                assert not is_parameter_predicate, "This parameter cannot be a predicate."
            elif isinstance(predicate, Branch):
                assert is_parameter_predicate, "This parameter must a predicate."
        elif isinstance(predicate, MultiParameter):
            parameters = predicate.parameters
            assert parameters is not None, "This parameter list cannot be None."
            is_parameter_list = isinstance(parameters, list)
            assert is_parameter_list, "This parameter list must be a list."
            assert _not_empty(parameters), "This parameter list must not be empty"
            are_parameters_predicates = (
                isinstance(parameter, Predicate) for parameter in parameters
            )
            if isinstance(predicate, Leaf):
                none_of_parameters_are_predicates = not any(are_parameters_predicates)
                assert none_of_parameters_are_predicates, "A leaf predicate does not accept predicate parameters."
            elif isinstance(predicate, Branch):
                all_parameters_are_predicates = all(are_parameters_predicates)
                assert all_parameters_are_predicates, "A branch predicate only accepts predicate parameters."
            all_parameters_unique = _all_items_unique(parameters)
            assert all_parameters_unique, "All parameters on a single predicate must be unique."
    except AssertionError as err:
        raise BadFilterFormat from err
