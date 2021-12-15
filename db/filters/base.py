"""
This module contains Predicate subclasses, and relevenat mixins, that describe nodes in a
predicate tree, or, in other words, predicates that compose into a tree. A predicate is
described by whether it's a Leaf or a Branch, whether it takes parameters and how many
(SingleParameter, MultiParameter, NoParameter) and whether it relies on comparability
(ReliesOnComparability), as well as its identifier and its human-friendly name.
"""

from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, List, Union, Type, Optional
from sqlalchemy_filters.exceptions import BadFilterFormat as SABadFilterFormat


class PredicatePositionId(Enum):
    """Every Predicate is either a leaf node in the predicate tree, or a branch node.
    A leaf node (e.g. EMPTY, EQUAL) has no predicate children, while a branch node
    (e.g. AND, OR, NOT) always has predicate children."""
    LEAF = "leaf"
    BRANCH = "branch"


class BranchPredicateId(Enum):
    NOT = "not"
    OR = "or"
    AND = "and"


class LeafPredicateId(Enum):
    """Note that negation is achieved via BranchPredicateId.NOT"""
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
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    CONTAINS = "contains"


class ParameterCount(Enum):
    """Predicates (currently only leaf predicates) can take single parameters (e.g. EQUAL
    predicate takes a value to check equality against), lists of parameters (e.g. the IN
    predicate takes a list of values to check membership against), or no paramaters (e.g.
    the EMPTY predicate).""" 
    SINGLE = "single"
    MULTI = "multi"
    NONE = "none"


def _get_static_SA_id_for_predicate_id(id: Union[LeafPredicateId, BranchPredicateId]) -> str:
    """Provides static predicate id -> SQLAlchemy id mapping
    Some predicate ids like LeafPredicateId.STARTS_WITH have a dynamic mapping,
    switching between 'like' and 'ilike' depending on whether case-sensitivity is desired:
    they are not covered by below mapping. Below mapping is used to not have to declare a
    saId property on every predicate that has a simple one-to-one mapping to an saId."""
    static_mapping = {
        BranchPredicateId.NOT: 'not',
        BranchPredicateId.AND: 'and',
        BranchPredicateId.OR: 'or',
        LeafPredicateId.EQUAL: 'eq',
        LeafPredicateId.NOT_EQUAL: 'ne',
        LeafPredicateId.GREATER: 'gt',
        LeafPredicateId.GREATER_OR_EQUAL: 'ge',
        LeafPredicateId.LESSER: 'lt',
        LeafPredicateId.LESSER_OR_EQUAL: 'le',
        LeafPredicateId.EMPTY: 'is_null',
        LeafPredicateId.NOT_EMPTY: 'is_not_null',
        LeafPredicateId.IN: 'in',
        LeafPredicateId.NOT_IN: 'not_in',
    }
    if id in static_mapping:
        return static_mapping[id]
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
    position: PredicatePositionId
    id: Union[LeafPredicateId, BranchPredicateId]
    name: str
    parameter_count: ParameterCount

    @property
    def saId(self) -> str:
        return _get_static_SA_id_for_predicate_id(self.id)

    def __post_init__(self):
        assert_predicate_correct(self)

    @property
    @abstractmethod
    def sa_parameter(self) -> Optional[Any]:
        """
        A concrete predicate has to define how to express its parameters in a SA spec,
        if it takes parameters (this method should return None otherwise). This is
        useful, because the MA spec is strict and explicit about expected number of
        parameters, while SA isn't.
        """
        return ""


@frozen_dataclass
class Leaf(Predicate):
    position: PredicatePositionId = static(PredicatePositionId.LEAF)
    id: LeafPredicateId
    column: str


@frozen_dataclass
class SingleParameter:
    parameter_count: ParameterCount = static(ParameterCount.SINGLE)
    parameter: Any

    @property
    def sa_parameter(self):
        if isinstance(self, Branch):
            # SA's branching predicates always expect a list of parameters (that are predicates).
            return [self.parameter]
        else:
            return self.parameter


@frozen_dataclass
class MultiParameter:
    parameter_count: ParameterCount = static(ParameterCount.MULTI)
    parameters: List[Any]

    @property
    def sa_parameter(self):
        return self.parameters


@frozen_dataclass
class NoParameter:
    parameter_count: ParameterCount = static(ParameterCount.NONE)

    @property
    def sa_parameter(self):
        return None


@frozen_dataclass
class Branch(Predicate):
    position: PredicatePositionId = static(PredicatePositionId.BRANCH)
    id: BranchPredicateId


@frozen_dataclass
class ReliesOnComparability:
    """Some predicates require the data types they are being applied to be comparable
    (lesser, greater, etc.)."""
    pass


def relies_on_comparability(predicate_subclass: Type[Predicate]) -> bool:
    return issubclass(predicate_subclass, ReliesOnComparability)


@frozen_dataclass
class Equal(SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.EQUAL)
    name: str = static("Equal")


@frozen_dataclass
class NotEqual(SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.NOT_EQUAL)
    name: str = static("Not equal")


@frozen_dataclass
class Greater(ReliesOnComparability, SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.GREATER)
    name: str = static("Greater")


@frozen_dataclass
class GreaterOrEqual(ReliesOnComparability, SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.GREATER_OR_EQUAL)
    name: str = static("Greater or equal")


@frozen_dataclass
class Lesser(ReliesOnComparability, SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.LESSER)
    name: str = static("Lesser")


@frozen_dataclass
class LesserOrEqual(ReliesOnComparability, SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.LESSER_OR_EQUAL)
    name: str = static("Lesser or equal")


@frozen_dataclass
class Empty(NoParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.EMPTY)
    name: str = static("Empty")


@frozen_dataclass
class NotEmpty(NoParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.NOT_EMPTY)
    name: str = static("Not empty")


@frozen_dataclass
class In(MultiParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.IN)
    name: str = static("In")


@frozen_dataclass
class NotIn(MultiParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.NOT_IN)
    name: str = static("Not in")


@frozen_dataclass
class Not(SingleParameter, Branch, Predicate):
    id: BranchPredicateId = static(BranchPredicateId.NOT)
    name: str = static("Not")


@frozen_dataclass
class And(MultiParameter, Branch, Predicate):
    id: BranchPredicateId = static(BranchPredicateId.AND)
    name: str = static("And")


@frozen_dataclass
class Or(MultiParameter, Branch, Predicate):
    id: BranchPredicateId = static(BranchPredicateId.OR)
    name: str = static("Or")


@frozen_dataclass
class ReliesOnLike(ABC):
    """Some predicates represent specific patterns applied with the SQL LIKE expression.
    These will invariably operate on text."""
    case_sensitive: bool = True

    @property
    def sa_parameter(self):
        return self.like_pattern
    
    @property
    @abstractmethod
    def like_pattern(self) -> str:
        """
        A class that's based on the LIKE expression needs to define how the LIKE
        expression pattern should be constructed. See PostgreSQL docs:
        https://www.postgresql.org/docs/8.3/functions-matching.html"""
        return ""

    @property
    def saId(self) -> str:
        """
        We're overriding saId, since LIKE-based predicates will rely on `like` or `ilike`
        SA filters, depending on whether case-sensitivity is desired.
        """
        if self.case_sensitive:
            return 'like'
        else:
            return 'ilike'
    
    @staticmethod
    def escape(parameter: str) -> str:
        """
        This method is static, since this mixin class doesn't know that/if it will be composed with a SingleParameter class.
        """
        escape_character = "\\"
        # NOTE: "\\" must be first in the list: otherwise the escape character could be escaped when it shouldn't be
        characters_to_escape = ("\\", "_", "%")
        escaped_parameter = parameter
        for character_to_escape in characters_to_escape:
            character_escaped = f"{escape_character}{character_to_escape}"
            escaped_parameter = escaped_parameter.replace(character_to_escape, character_escaped)
        return escaped_parameter


def relies_on_like(predicate_subclass: Type[Predicate]) -> bool:
    return issubclass(predicate_subclass, ReliesOnLike)


@frozen_dataclass
class StartsWith(ReliesOnLike, SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.STARTS_WITH)
    name: str = static("Starts with")

    @property
    def like_pattern(self) -> str:
        escaped_parameter = self.escape(self.parameter)
        return f"{escaped_parameter}%"


@frozen_dataclass
class EndsWith(ReliesOnLike, SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.ENDS_WITH)
    name: str = static("Ends with")

    @property
    def like_pattern(self) -> str:
        escaped_parameter = self.escape(self.parameter)
        return f"%{escaped_parameter}"


@frozen_dataclass
class Contains(ReliesOnLike, SingleParameter, Leaf, Predicate):
    id: LeafPredicateId = static(LeafPredicateId.CONTAINS)
    name: str = static("Contains")

    @property
    def like_pattern(self) -> str:
        escaped_parameter = self.escape(self.parameter)
        return f"%{escaped_parameter}%"


def get_predicate_subclass_by_id_str(predicate_id_str: str) -> Union[Type[LeafPredicateId], Type[BranchPredicateId]]:
    for subclass in all_predicates:
        if subclass.id.value == predicate_id_str:
            return subclass
    raise BadFilterFormat(f'Unknown predicate id: {predicate_id_str}')


# TODO should our filter format exception extend SA's? We're using this exception for SA-unrelated formats (the MA filters spec).
class BadFilterFormat(SABadFilterFormat):
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
    StartsWith,
    EndsWith,
    Contains,
]


def not_empty(xs):
    return len(xs) > 0


def all_items_unique(xs):
    for item1 in xs:
        times_seen = 0
        for item2 in xs:
            if item1 == item2:
                times_seen += 1
            # A non-duplicate will be seen only once.
            if times_seen == 2:
                return False
    return True


# TODO can these asserts be moved to their respective class definitions?
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
                if isinstance(predicate, ReliesOnLike):
                    is_parameter_string = isinstance(parameter, str)
                    assert is_parameter_string, "This parameter must be a string."
                else:
                    assert not is_parameter_predicate, "This parameter cannot be a predicate."
            elif isinstance(predicate, Branch):
                assert is_parameter_predicate, "This parameter must a predicate."
        elif isinstance(predicate, MultiParameter):
            parameters = predicate.parameters
            assert parameters is not None, "This parameter list cannot be None."
            is_parameter_list = isinstance(parameters, list)
            assert is_parameter_list, "This parameter list must be a list."
            assert not_empty(parameters), "This parameter list must not be empty"
            are_parameters_predicates = (
                isinstance(parameter, Predicate) for parameter in parameters
            )
            if isinstance(predicate, Leaf):
                none_of_parameters_are_predicates = not any(are_parameters_predicates)
                assert none_of_parameters_are_predicates, "A leaf predicate does not accept predicate parameters."
            elif isinstance(predicate, Branch):
                all_parameters_are_predicates = all(are_parameters_predicates)
                assert all_parameters_are_predicates, "A branch predicate only accepts predicate parameters."
            all_parameters_unique = all_items_unique(parameters)
            assert all_parameters_unique, "All parameters on a single predicate must be unique."
    except AssertionError as err:
        raise BadFilterFormat from err
