"""
This module contains Predicate subclasses, and relevenat mixins, that describe nodes in a
predicate tree, or, in other words, predicates that compose into a tree. A predicate is
described by whether it's a Leaf or a Branch, whether it takes parameters and how many
(SingleParameter, MultiParameter, NoParameter) and whether it relies on comparability
(ReliesOnComparability), as well as its identifier and its human-friendly name.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, List, Union, Type, Set, Tuple
from abc import ABC, abstractmethod
from collections.abc import Sequence

from sqlalchemy_filters.exceptions import BadFilterFormat as SABadFilterFormat
from sqlalchemy import column, not_, and_, or_, func
from db.types.uri import URIFunction

import suggestions


# frozen=True provides immutability
def frozen_dataclass(f):
    return dataclass(frozen=True)(f)


def static(value):
    """
    Declares a static field on a dataclass.
    """
    return field(init=False, default=value)


@frozen_dataclass
class Expression(ABC):
    id: str
    name: str
    suggestions: Set = static(None)
    parameters: Sequence

    @staticmethod
    @abstractmethod
    def to_sa_expression():
        return None


@frozen_dataclass
class ColumnReference(Expression):
    id: str = static("column_reference")
    name: str = static("Column Reference")
    suggestions: Set = static({
        suggestions.ParameterCount(1),
        suggestions.Parameter(1, suggestions.Column)
    })

    @staticmethod
    def to_sa_expression(p):
        return column(p)


@frozen_dataclass
class Empty(Expression):
    id: str = static("empty")
    name: str = static("Empty")
    suggestions: Set = static({
        suggestions.Returns(suggestions.Boolean)
        suggestions.ParameterCount(1),
    })

    @staticmethod
    def to_sa_expression(p):
        return p.is_(None)


@frozen_dataclass
class Greater(Expression):
    id: str = static("greater")
    name: str = static("Greater")
    suggestions: Set = static({
        suggestions.Returns(suggestions.Boolean),
        suggestions.ParameterCount(2),
        suggestions.AllParameters(suggestions.Comparable)
    })

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.gt(p2)


@frozen_dataclass
class In(Expression):
    id: str = static("in")
    name: str = static("In")
    suggestions: Set = static({
        suggestions.Returns(suggestions.Boolean),
        suggestions.ParameterCount(2),
        suggestions.Parameter(2, suggestions.Array)
    })

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.in_(p2)


@frozen_dataclass
class And(Expression):
    id: str = static("and")
    name: str = static("And")
    suggestions: Set = static({
        suggestions.Returns(suggestions.Boolean)
    })

    @staticmethod
    def to_sa_expression(*ps):
        return and_(*ps)


@frozen_dataclass
class StartsWith(Expression):
    id: str = static("starts_with")
    name: str = static("Starts With")
    suggestions: Set = static({
        suggestions.Returns(suggestions.Boolean)
        suggestions.ParameterCount(2),
        suggestions.AllParameters(suggestions.StringLike)
    })

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.like(f"{p2}%")


@frozen_dataclass
class ToLowercase(Expression):
    id: str = static("to_lowercase")
    name: str = static("To Lowercase")
    suggestions: Set = static({
        suggestions.ParameterCount(1),
        suggestions.AllParameters(suggestions.StringLike)
    })

    @staticmethod
    def to_sa_expression(p1):
        return func.lower(p1)


@frozen_dataclass
class ExtractURIAuthority(Expression):
    id: str = static("extract_uri_authority")
    name: str = static("Extract URI Authority")
    suggestions: Set = static({
        suggestions.ParameterCount(1)
        suggestions.Parameter(1, suggestions.URI)
    })

    @staticmethod
    def to_sa_expression(p1):
        return func.getattr(URIFunction.AUTHORITY)(p1)


# Enumeration of supported Expression subclasses; useful when parsing.
supported_expressions = tuple(
    [
        ColumnReference,
        Empty,
        Greater,
        In,
        And,
        StartsWith,
        ToLowercase,
        ExtractURIAuthority,
    ]
)


# Sample filter expression tree
And([
    StartsWith([
        ExtractURIAuthority([
            ColumnReference("uri_col")
        ]),
        "google"
    ]),
    Greater([
        ColumnReference("some_col"),
        ColumnReference("some_other_col"),
    ]),
])


class BadFilterFormat(SABadFilterFormat):
    pass


class UnknownPredicateType(BadFilterFormat):
    pass


class ReferencedColumnsDontExist(BadFilterFormat):
    pass
