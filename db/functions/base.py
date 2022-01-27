"""
This namespace defines the DBFunction abstract class and its subclasses. These subclasses
represent functions that have identifiers, display names and hints, and their instances
hold parameters. Each DBFunction subclass defines how its instance can be converted into an
SQLAlchemy expression.

Hints hold information about what kind of input the function might expect and what output
can be expected from it. This is used to provide interface information without constraining its
user.

These classes might be used, for example, to define a filter for an SQL query, or to
access hints on what composition of functions and parameters should be valid.
"""

from abc import ABC, abstractmethod

from sqlalchemy import column, not_, and_, or_, func, literal
from db.types.uri import URIFunction

from db.functions import hints

import importlib
import inspect


class DBFunction(ABC):
    id = None
    name = None
    hints = None

    def __init__(self, parameters):
        if self.id is None:
            raise ValueError('DBFunction subclasses must define an ID.')
        if self.name is None:
            raise ValueError('DBFunction subclasses must define a name.')
        self.parameters = parameters

    @property
    def referenced_columns(self):
        """Walks the expression tree, collecting referenced columns.
        Useful when checking if all referenced columns are present in the queried relation."""
        columns = set([])
        for parameter in self.parameters:
            if isinstance(parameter, ColumnReference):
                columns.add(parameter.column)
            elif isinstance(parameter, DBFunction):
                columns.update(parameter.referenced_columns)
        return columns

    @staticmethod
    @abstractmethod
    def to_sa_expression():
        return None


class Literal(DBFunction):
    id = 'literal'
    name = 'Literal'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.literal),
    ])

    @staticmethod
    def to_sa_expression(p):
        return literal(p)


class ColumnReference(DBFunction):
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


class List(DBFunction):
    id = 'list'
    name = 'List'

    @staticmethod
    def to_sa_expression(*ps):
        return list(ps)


class Empty(DBFunction):
    id = 'empty'
    name = 'Empty'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(1),
    ])

    @staticmethod
    def to_sa_expression(p):
        return p.is_(None)


class Not(DBFunction):
    id = 'not'
    name = 'Not'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(1),
    ])

    @staticmethod
    def to_sa_expression(*p):
        return not_(*p)


class Equal(DBFunction):
    id = 'equal'
    name = 'Equal'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1 == p2


class Greater(DBFunction):
    id = 'greater'
    name = 'Greater'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1 > p2


class Lesser(DBFunction):
    id = 'lesser'
    name = 'Lesser'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
    ])

    @staticmethod
    def to_sa_expression(p1, p2):
        return p1 < p2


class In(DBFunction):
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


class And(DBFunction):
    id = 'and'
    name = 'And'
    hints = tuple([
        hints.returns(hints.boolean),
    ])

    @staticmethod
    def to_sa_expression(*ps):
        return and_(*ps)


class Or(DBFunction):
    id = 'or'
    name = 'Or'
    hints = tuple([
        hints.returns(hints.boolean),
    ])

    @staticmethod
    def to_sa_expression(*ps):
        return or_(*ps)


class StartsWith(DBFunction):
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


class ToLowercase(DBFunction):
    id = 'to_lowercase'
    name = 'To Lowercase'
    hints = tuple([
        hints.parameter_count(1),
        hints.all_parameters(hints.string_like),
    ])

    @staticmethod
    def to_sa_expression(p1):
        return func.lower(p1)


class ExtractURIAuthority(DBFunction):
    id = 'extract_uri_authority'
    name = 'Extract URI Authority'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.uri),
    ])

    @staticmethod
    def to_sa_expression(p1):
        return func.getattr(URIFunction.AUTHORITY)(p1)


def _get_defining_module_members_that_satisfy(predicate):
    # NOTE: the value returned by globals() (when it's called within a function) is set when the
    # function is defined and does not change depending on where the function is called from.
    # See https://docs.python.org/3/library/functions.html#globals
    # If we wanted to move this function into another namespace, we would have to additionally
    # pass it this namespace's globals().
    defining_module_name = globals()['__name__']
    defining_module = importlib.import_module(defining_module_name)
    all_members_in_defining_module = inspect.getmembers(defining_module)
    return tuple(
        member
        for _, member in all_members_in_defining_module
        if predicate(member)
    )


def _is_concrete_db_function_subclass(member):
    return inspect.isclass(member) and member != DBFunction and issubclass(member, DBFunction)


# Enumeration of supported DBFunction subclasses; needed when parsing.
supported_db_functions = _get_defining_module_members_that_satisfy(_is_concrete_db_function_subclass)
