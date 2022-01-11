# TODO
"""
TBD
"""

from dataclasses import dataclass, field
#from typing import List
from abc import ABC, abstractmethod
from collections.abc import Sequence

from sqlalchemy_filters.exceptions import BadFilterFormat as SABadFilterFormat
from sqlalchemy import column, not_, and_, or_, func
from db.types.uri import URIFunction

from db.filters import suggestions


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
    suggestions: Sequence = static(None)
    parameters: Sequence

    @property
    def referenced_columns(self):
        """Walks the expression tree, collecting referenced columns.
        Useful when checking if all referenced columns are present in the queried relation."""
        columns = []
        for parameter in self.parameters:
            if isinstance(parameter, ColumnReference):
                columns.append(parameter.column)
            elif isinstance(parameter, Expression):
                columns.append(parameter.referenced_columns)
        return columns

    @staticmethod
    @abstractmethod
    def to_sa_expression():
        return None


@frozen_dataclass
class ColumnReference(Expression):
    id: str = static("column_reference")
    name: str = static("Column Reference")
    suggestions: Sequence = static([
        suggestions.parameter_count(1),
        suggestions.parameter(1, suggestions.column),
    ])

    def column(self):
        return self.parameters[0]

    @staticmethod
    def to_sa_expression(p):
        return column(p)


@frozen_dataclass
class List(Expression):
    id: str = static("list")
    name: str = static("List")

    @staticmethod
    def to_sa_expression(*ps):
        return list(ps)


@frozen_dataclass
class Empty(Expression):
    id: str = static("empty")
    name: str = static("Empty")
    suggestions: Sequence = static([
        suggestions.returns(suggestions.boolean),
        suggestions.parameter_count(1),
    ])

    @staticmethod
    def to_sa_expression(p):
        return p.is_(None)


@frozen_dataclass
class Greater(Expression):
    id: str = static("greater")
    name: str = static("Greater")
    suggestions: Sequence = static([
        suggestions.returns(suggestions.boolean),
        suggestions.parameter_count(2),
        suggestions.all_parameters(suggestions.comparable),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.gt(p2)


@frozen_dataclass
class In(Expression):
    id: str = static("in")
    name: str = static("In")
    suggestions: Sequence = static([
        suggestions.returns(suggestions.boolean),
        suggestions.parameter_count(2),
        suggestions.parameter(2, suggestions.array),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.in_(p2)


@frozen_dataclass
class And(Expression):
    id: str = static("and")
    name: str = static("And")
    suggestions: Sequence = static([
        suggestions.returns(suggestions.boolean),
    ])

    @staticmethod
    def to_sa_expression(*ps):
        return and_(*ps)


@frozen_dataclass
class StartsWith(Expression):
    id: str = static("starts_with")
    name: str = static("Starts With")
    suggestions: Sequence = static([
        suggestions.returns(suggestions.boolean),
        suggestions.parameter_count(2),
        suggestions.all_parameters(suggestions.string_like),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.like(f"{p2}%")


@frozen_dataclass
class ToLowercase(Expression):
    id: str = static("to_lowercase")
    name: str = static("To Lowercase")
    suggestions: Sequence = static([
        suggestions.parameter_count(1),
        suggestions.all_parameters(suggestions.string_like),
    ])

    @staticmethod
    def to_sa_expression(p1):
        return func.lower(p1)


@frozen_dataclass
class ExtractURIAuthority(Expression):
    id: str = static("extract_uri_authority")
    name: str = static("Extract URI Authority")
    suggestions: Sequence = static([
        suggestions.parameter_count(1),
        suggestions.parameter(1, suggestions.uri),
    ])

    @staticmethod
    def to_sa_expression(p1):
        return func.getattr(URIFunction.AUTHORITY)(p1)


# Enumeration of supported Expression subclasses; needed when parsing.
supported_expressions = tuple(
    [
        List,
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


class BadFilterFormat(SABadFilterFormat):
    pass


class UnknownPredicateType(BadFilterFormat):
    pass


class ReferencedColumnsDontExist(BadFilterFormat):
    pass
