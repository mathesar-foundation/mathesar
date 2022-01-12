# TODO
"""
TBD
"""

from abc import ABC, abstractmethod

from sqlalchemy_filters.exceptions import BadFilterFormat as SABadFilterFormat
from sqlalchemy import column, not_, and_, or_, func
from db.types.uri import URIFunction

from db.filters import suggestions


class Expression(ABC):
    id = None
    name = None
    suggestions = None

    def __init__(self, parameters):
        if self.id is None:
            raise ValueError('Expression subclasses must define an ID.')
        if self.name is None:
            raise ValueError('Expression subclasses must define a name.')
        self.parameters = parameters

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


class ColumnReference(Expression):
    id = "column_reference"
    name = "Column Reference"
    suggestions = tuple([
        suggestions.parameter_count(1),
        suggestions.parameter(1, suggestions.column),
    ])

    @property
    def column(self):
        return self.parameters[0]

    @staticmethod
    def to_sa_expression(p):
        return column(p)


class List(Expression):
    id = "list"
    name = "List"

    @staticmethod
    def to_sa_expression(*ps):
        return list(ps)


class Empty(Expression):
    id = "empty"
    name = "Empty"
    suggestions = tuple([
        suggestions.returns(suggestions.boolean),
        suggestions.parameter_count(1),
    ])

    @staticmethod
    def to_sa_expression(p):
        return p.is_(None)


class Greater(Expression):
    id = "greater"
    name = "Greater"
    suggestions = tuple([
        suggestions.returns(suggestions.boolean),
        suggestions.parameter_count(2),
        suggestions.all_parameters(suggestions.comparable),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.gt(p2)


class In(Expression):
    id = "in"
    name = "In"
    suggestions = tuple([
        suggestions.returns(suggestions.boolean),
        suggestions.parameter_count(2),
        suggestions.parameter(2, suggestions.array),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.in_(p2)


class And(Expression):
    id = "and"
    name = "And"
    suggestions = tuple([
        suggestions.returns(suggestions.boolean),
    ])

    @staticmethod
    def to_sa_expression(*ps):
        return and_(*ps)


class StartsWith(Expression):
    id = "starts_with"
    name = "Starts With"
    suggestions = tuple([
        suggestions.returns(suggestions.boolean),
        suggestions.parameter_count(2),
        suggestions.all_parameters(suggestions.string_like),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.like(f"{p2}%")


class ToLowercase(Expression):
    id = "to_lowercase"
    name = "To Lowercase"
    suggestions = tuple([
        suggestions.parameter_count(1),
        suggestions.all_parameters(suggestions.string_like),
    ])

    @staticmethod
    def to_sa_expression(p1):
        return func.lower(p1)


class ExtractURIAuthority(Expression):
    id = "extract_uri_authority"
    name = "Extract URI Authority"
    suggestions = tuple([
        suggestions.parameter_count(1),
        suggestions.parameter(1, suggestions.uri),
    ])

    @staticmethod
    def to_sa_expression(p1):
        return func.getattr(URIFunction.AUTHORITY)(p1)


# Enumeration of supported Expression subclasses; needed when parsing.
supported_expressions = tuple(
    [
        ColumnReference,
        List,
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
