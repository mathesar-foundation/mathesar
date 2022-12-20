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

from sqlalchemy import column, not_, and_, or_, func, literal, cast, distinct
from sqlalchemy.dialects.postgresql import array_agg, TEXT, array
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction, concat

from db.engine import get_dummy_engine
from db.functions import hints
from db.functions.exceptions import BadDBFunctionFormat
from db.types.base import PostgresType
from db.types.custom.json_array import MathesarJsonArray
from db.types.custom.email import EMAIL_DOMAIN_NAME
from db.types.custom.uri import URIFunction
from db.types.custom.underlying_type import HasUnderlyingType


def sa_call_sql_function(function_name, *parameters, return_type=None):
    """
    This function registers an SQL function with SQLAlchemy and generates
    an expression to call it.

    function_name: string giving a namespaced SQL function
    *parameters:   these will be passed directly to the generated function.
    return_type:   an SQLAlchemy type class
    """
    engine = get_dummy_engine()
    if return_type is None:
        warnings.warn(
            "sa_call_sql_function should be called with the return_type kwarg set"
        )
        # We can't use PostgresType since we don't want an engine here
        return_type = PostgresType.TEXT

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
                "type": return_type.get_sa_class(engine),
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


class ColumnName(DBFunction):
    """
    This represents referencing columns by their Postgres name.

    Important note: referencing a column this way only provides its name to SQLAlchemy. It doesn't
    provide, for example, type information (the type will be "NullType"). As of the time of
    writing, we don't have a recommended alternative; this is a to-be-solved oversight.
    """
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


class Null(DBFunction):
    id = 'null'
    name = 'is null'
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
        return sa_call_sql_function('count', column_expr, return_type=PostgresType.INTEGER)


class ArrayAgg(DBFunction):
    id = 'aggregate_to_array'
    name = 'aggregate to array'
    hints = tuple([
        hints.aggregation,
    ])

    @staticmethod
    def to_sa_expression(column_expr):
        column_expr = _maybe_downcast(column_expr)
        return array_agg(column_expr)


class Distinct(DBFunction):
    id = 'distinct'
    name = 'distinct'

    @staticmethod
    def to_sa_expression(column_expr):
        return distinct(column_expr)


class ArrayContains(DBFunction):
    id = 'array_contains'
    name = 'contains'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.array),
        hints.parameter(1, hints.array),
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return sa_call_sql_function(
            'arraycontains',
            value1,
            array(value2),
            return_type=PostgresType.BOOLEAN
        )


class ArrayLength(DBFunction):
    id = 'array_length'
    name = 'length'
    hints = tuple([
        hints.returns(hints.comparable),
        hints.parameter_count(2),
        hints.parameter(0, hints.array),
        hints.parameter(1, hints.any),
        hints.mathesar_filter
    ])

    @staticmethod
    def to_sa_expression(value, dimension):
        array_length = sa_call_sql_function(
            'array_length',
            value,
            dimension,
            return_type=PostgresType.INTEGER,
        )
        # The SQL function `array_length` returns NULL, when the array is empty. We want
        # output to default to 0 (zero) in that case.
        default_when_empty = 0
        with_default = sa_call_sql_function(
            'coalesce',
            array_length,
            default_when_empty,
            return_type=PostgresType.INTEGER,
        )
        return with_default


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
        return sa_call_sql_function('jsonb_array_length', value, return_type=PostgresType.INTEGER)


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
            return_type=PostgresType.BOOLEAN
        )


class ExtractURIAuthority(DBFunction):
    id = 'extract_uri_authority'
    name = 'extract URI authority'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.uri),
    ])
    depends_on = tuple([URIFunction.AUTHORITY])

    @staticmethod
    def to_sa_expression(uri):
        return sa_call_sql_function(URIFunction.AUTHORITY.value, uri, return_type=PostgresType.TEXT)


class ExtractURIScheme(DBFunction):
    id = 'extract_uri_scheme'
    name = 'extract URI scheme'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.uri),
    ])
    depends_on = tuple([URIFunction.SCHEME])

    @staticmethod
    def to_sa_expression(uri):
        return sa_call_sql_function(URIFunction.SCHEME.value, uri, return_type=PostgresType.TEXT)


class TruncateToYear(DBFunction):
    id = 'truncate_to_year'
    name = 'Truncate to Year'
    hints = tuple([hints.parameter_count(1)])  # TODO extend hints

    @staticmethod
    def to_sa_expression(col):
        return sa_call_sql_function('to_char', col, 'YYYY', return_type=PostgresType.TEXT)


class TruncateToMonth(DBFunction):
    id = 'truncate_to_month'
    name = 'Truncate to Month'
    hints = tuple([hints.parameter_count(1)])  # TODO extend hints

    @staticmethod
    def to_sa_expression(col):
        return sa_call_sql_function('to_char', col, 'YYYY-MM', return_type=PostgresType.TEXT)


class TruncateToDay(DBFunction):
    id = 'truncate_to_day'
    name = 'Truncate to Day'
    hints = tuple([hints.parameter_count(1)])  # TODO extend hints

    @staticmethod
    def to_sa_expression(col):
        return sa_call_sql_function('to_char', col, 'YYYY-MM-DD', return_type=PostgresType.TEXT)


class CurrentDate(DBFunction):
    id = 'current_date'
    name = 'current date'
    hints = tuple([hints.returns(hints.date), hints.parameter_count(0)])

    @staticmethod
    def to_sa_expression():
        return sa_call_sql_function('current_date', return_type=PostgresType.DATE)


class CurrentTime(DBFunction):
    id = 'current_time'
    name = 'current time'
    hints = tuple([hints.returns(hints.time), hints.parameter_count(0)])

    @staticmethod
    def to_sa_expression():
        return sa_call_sql_function(
            'current_time', return_type=PostgresType.TIME_WITH_TIME_ZONE
        )


class CurrentDateTime(DBFunction):
    id = 'current_datetime'
    name = 'current datetime'
    hints = tuple([hints.returns(hints.date, hints.time), hints.parameter_count(0)])

    @staticmethod
    def to_sa_expression():
        return sa_call_sql_function(
            'current_timestamp', return_type=PostgresType.TIMESTAMP_WITH_TIME_ZONE
        )


class ExtractEmailDomain(DBFunction):
    id = 'extract_email_domain'
    name = 'extract email domain'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.email),
    ])
    depends_on = tuple([EMAIL_DOMAIN_NAME])

    @staticmethod
    def to_sa_expression(email):
        return sa_call_sql_function(EMAIL_DOMAIN_NAME, email, return_type=PostgresType.TEXT)


def _maybe_downcast(column_expr):
    """
    We'll want to downcast some types to a psycopg-compatible type sometimes.
    See documentation in `HasUnderlyingType`.
    """
    column_expr_type = column_expr.type
    if isinstance(column_expr_type, HasUnderlyingType):
        column_expr = column_expr_type.downcast_to_underlying_type(column_expr)
    return column_expr
