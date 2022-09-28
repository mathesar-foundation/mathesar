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
import warnings

from sqlalchemy import column, not_, and_, or_, func, literal, cast
from sqlalchemy.dialects.postgresql import array_agg, INTEGER, TEXT, BOOLEAN
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction, concat

from db.functions import hints
from db.functions.exceptions import BadDBFunctionFormat
from db.types.custom.json_array import MathesarJsonArray


def sa_call_sql_function(function_name, *parameters, return_type=None):
    """
    This function registers an SQL function with SQLAlchemy and generates
    an expression to call it.

    function_name: string giving a namespaced SQL function
    *parameters:   these will be passed directly to the generated function.
    return_type:   an SQLAlchemy type class
    """
    if return_type is None:
        warnings.warn(
            "sa_call_sql_function should be called with the return_type kwarg set"
        )
        # We can't use PostgresType since we don't want an engine here
        return_type = TEXT

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="The GenericFunction")
        # Creating this type registers the function (more importantly,
        # its return type) with SQLAlchemy. **magic!!**
        # Note that it's not necessary to assign the type to a variable,
        # since it gets picked up whenever the type is defined for the
        # interpreter, which happens when the function `type` is called.
        type(
            function_name,
            (GenericFunction,),
            {
                "type": return_type,
                "name": quoted_name(function_name, False),
                "identifier": function_name,
            }
        )
    return getattr(func, function_name)(*parameters)


# NOTE: this class is abstract.
class DBFunction(ABC):
    id = None
    name = None
    hints = None

    # Optionally lists the SQL functions this DBFunction depends on.
    # Will be checked against SQL functions defined on a database to tell if it
    # supports this DBFunction. Either None or a tuple of SQL function name
    # strings.
    depends_on = None

    def __eq__(self, other):
        return (
            isinstance(other, DBFunction)
            and self.id == other.id
            and self.parameters == other.parameters
        )

    def __init__(self, parameters):
        if self.id is None:
            raise ValueError('DBFunction subclasses must define an ID.')
        if self.name is None:
            raise ValueError('DBFunction subclasses must define a name.')
        if self.depends_on is not None and not isinstance(self.depends_on, tuple):
            raise ValueError('DBFunction subclasses\' depends_on attribute must either be None or a tuple of SQL function names.')
        if not isinstance(parameters, list):
            raise BadDBFunctionFormat('DBFunction instance parameter `parameters` must be a list.')
        self.parameters = parameters

    @property
    def referenced_columns(self):
        """Walks the expression tree, collecting referenced columns.
        Useful when checking if all referenced columns are present in the queried relation."""
        columns = set([])
        for parameter in self.parameters:
            if isinstance(parameter, ColumnName):
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
    name = 'as literal'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(0, hints.literal),
    ])

    @staticmethod
    def to_sa_expression(primitive):
        return literal(primitive)


class Noop(DBFunction):
    """This Noop function is an unwrapped version of Literal().
    The Literal DB function produces a literal SQLAlchemy wrapper
    which doesn't play nicely with the type conversion between python classes and db types in psycopg2."""
    id = 'noop'
    name = 'no wrapping'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(0, hints.literal),
    ])

    @staticmethod
    def to_sa_expression(primitive):
        return primitive


# This represents referencing columns by their Postgres name.
class ColumnName(DBFunction):
    id = 'column_name'
    name = 'as column name'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(0, hints.column),
    ])

    @property
    def column(self):
        return self.parameters[0]

    @staticmethod
    def to_sa_expression(column_name):
        return column(column_name)


class List(DBFunction):
    id = 'list'
    name = 'as list'

    @staticmethod
    def to_sa_expression(*items):
        return list(items)


class Empty(DBFunction):
    id = 'empty'
    name = 'is empty'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(1),
        hints.parameter(0, hints.any),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value):
        return value.is_(None)


class Not(DBFunction):
    id = 'not'
    name = 'negate'
    hints = tuple([
        hints.returns(hints.boolean),
    ])

    @staticmethod
    def to_sa_expression(*values):
        length = len(values)
        if length > 1:
            return not_(and_(*values))
        else:
            return not_(values[0])


class Equal(DBFunction):
    id = 'equal'
    name = 'is equal to'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.any),
        hints.mathesar_filter,
        hints.use_this_alias_when("is same as", hints.point_in_time),
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return value1 == value2


class Greater(DBFunction):
    id = 'greater'
    name = 'is greater than'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
        hints.mathesar_filter,
        hints.use_this_alias_when("is after", hints.point_in_time),
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return value1 > value2


class Lesser(DBFunction):
    id = 'lesser'
    name = 'is lesser than'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
        hints.mathesar_filter,
        hints.use_this_alias_when("is before", hints.point_in_time),
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return value1 < value2


class In(DBFunction):
    id = 'in'
    name = 'is in'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.any),
        hints.parameter(1, hints.array),
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return value1.in_(value2)


class And(DBFunction):
    id = 'and'
    name = 'and'
    hints = tuple([
        hints.returns(hints.boolean),
    ])

    @staticmethod
    def to_sa_expression(*values):
        return and_(*values)


class Or(DBFunction):
    id = 'or'
    name = 'or'
    hints = tuple([
        hints.returns(hints.boolean),
    ])

    @staticmethod
    def to_sa_expression(*values):
        return or_(*values)


class StartsWith(DBFunction):
    id = 'starts_with'
    name = 'starts with'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.string_like),
    ])

    @staticmethod
    def to_sa_expression(string, prefix):
        pattern = concat(prefix, '%')
        return string.like(pattern)


class Contains(DBFunction):
    id = 'contains'
    name = 'contains'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.string_like),
    ])

    @staticmethod
    def to_sa_expression(string, sub_string):
        pattern = concat('%', sub_string, '%')
        return string.like(pattern)


class StartsWithCaseInsensitive(DBFunction):
    id = 'starts_with_case_insensitive'
    name = 'starts with'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.string_like),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(string, prefix):
        pattern = concat(prefix, '%')
        return string.ilike(pattern)


class ContainsCaseInsensitive(DBFunction):
    id = 'contains_case_insensitive'
    name = 'contains'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.string_like),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(string, sub_string):
        pattern = concat('%', sub_string, '%')
        return string.ilike(pattern)


class ToLowercase(DBFunction):
    id = 'to_lowercase'
    name = 'to lowercase'
    hints = tuple([
        hints.returns(hints.string_like),
        hints.parameter_count(1),
        hints.all_parameters(hints.string_like),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(string):
        return sa_call_sql_function('lower', string, TEXT)


class Count(DBFunction):
    id = 'count'
    name = 'count'
    hints = tuple([
        hints.aggregation,
    ])

    @staticmethod
    def to_sa_expression(column_expr):
        return sa_call_sql_function('count', column_expr, return_type=INTEGER)


class ArrayAgg(DBFunction):
    id = 'aggregate_to_array'
    name = 'aggregate to array'
    hints = tuple([
        hints.aggregation,
    ])

    @staticmethod
    def to_sa_expression(column_expr):
        return array_agg(column_expr)


class Alias(DBFunction):
    id = 'alias'
    name = 'alias'
    hints = tuple([
        hints.parameter_count(2),
        hints.parameter(0, hints.column),
    ])

    @staticmethod
    def to_sa_expression(expr, alias):
        return expr.label(alias)


class JsonArrayLength(DBFunction):
    id = 'json_array_length'
    name = 'length'
    hints = tuple([
        hints.returns(hints.comparable),
        hints.parameter_count(1),
        hints.parameter(0, hints.json_array),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value):
        return sa_call_sql_function('jsonb_array_length', value, return_type=INTEGER)


class JsonArrayContains(DBFunction):
    id = 'json_array_contains'
    name = 'contains'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_array),
        hints.parameter(1, hints.array),
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return sa_call_sql_function(
            'jsonb_contains',
            value1,
            cast(value2, MathesarJsonArray),
            return_type=BOOLEAN
        )
