"""
This namespace defines the DB Function abstract class and its subclasses. These subclasses
represent functions that have identifiers, display names and hints, and their instances
hold parameters. Each function subclass defines how its instance can be converted into an
SQLAlchemy expression.

Hints hold information about what kind of input the function might expect and what output
can be expected from it. This is used to provide interface information without constraining its
user.

These functions might be used, for example, to define a filter for a table and to tell the
frontend what it can use when constructing that filter.
"""

from abc import ABC, abstractmethod

from sqlalchemy import column, not_, and_, or_, func
from db.types.uri import URIFunction

from mathesar.database.functions import hints


class Function(ABC):
    id = None
    name = None
    hints = None

    def __init__(self, parameters):
        if self.id is None:
            raise ValueError('Function subclasses must define an ID.')
        if self.name is None:
            raise ValueError('Function subclasses must define a name.')
        self.parameters = parameters

    @property
    def referenced_columns(self):
        """Walks the expression tree, collecting referenced columns.
        Useful when checking if all referenced columns are present in the queried relation."""
        columns = set([])
        for parameter in self.parameters:
            if isinstance(parameter, ColumnReference):
                columns.add(parameter.column)
            elif isinstance(parameter, Function):
                columns.update(parameter.referenced_columns)
        return columns

    @staticmethod
    @abstractmethod
    def to_sa_expression():
        return None


class ColumnReference(Function):
    id = 'column_reference'
    name = 'Column Reference'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.column),
    ])

    @property
    def column(self):
        return self.parameters[0]

    @staticmethod
    def to_sa_expression(p):
        return column(p)


class List(Function):
    id = 'list'
    name = 'List'

    @staticmethod
    def to_sa_expression(*ps):
        return list(ps)


class Empty(Function):
    id = 'empty'
    name = 'Empty'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(1),
    ])

    @staticmethod
    def to_sa_expression(p):
        return p.is_(None)


class Not(Function):
    id = 'not'
    name = 'Not'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(1),
    ])

    @staticmethod
    def to_sa_expression(*p):
        return not_(*p)
        

class Equal(Function):
    id = 'equal'
    name = 'Equal'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.eq(p2)


class Greater(Function):
    id = 'greater'
    name = 'Greater'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.gt(p2)


class In(Function):
    id = 'in'
    name = 'In'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(2, hints.array),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.in_(p2)


class And(Function):
    id = 'and'
    name = 'And'
    hints = tuple([
        hints.returns(hints.boolean),
    ])

    @staticmethod
    def to_sa_expression(*ps):
        return and_(*ps)


class Or(Function):
    id = 'or'
    name = 'Or'
    hints = tuple([
        hints.returns(hints.boolean),
    ])

    @staticmethod
    def to_sa_expression(*ps):
        return or_(*ps)


class StartsWith(Function):
    id = 'starts_with'
    name = 'Starts With'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.string_like),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1.like(f'{p2}%')


class ToLowercase(Function):
    id = 'to_lowercase'
    name = 'To Lowercase'
    hints = tuple([
        hints.parameter_count(1),
        hints.all_parameters(hints.string_like),
    ])

    @staticmethod
    def to_sa_expression(p1):
        return func.lower(p1)


class ExtractURIAuthority(Function):
    id = 'extract_uri_authority'
    name = 'Extract URI Authority'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.uri),
    ])

    @staticmethod
    def to_sa_expression(p1):
        return func.getattr(URIFunction.AUTHORITY)(p1)


# Enumeration of supported Function subclasses; needed when parsing.
supported_db_functions = tuple(
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
