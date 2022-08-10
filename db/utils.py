import inspect

from psycopg2.errors import UndefinedFunction

import sqlalchemy
from sqlalchemy.exc import ProgrammingError

from db.records import exceptions


def execute_statement(engine, statement, connection_to_use=None):
    try:
        if connection_to_use:
            return connection_to_use.execute(statement)
        else:
            with engine.begin() as conn:
                return conn.execute(statement)
    except ProgrammingError as e:
        if isinstance(e.orig, UndefinedFunction):
            message = e.orig.args[0].split('\n')[0]
            raise exceptions.UndefinedFunction(message)
        else:
            raise e


def execute_pg_query(engine, query, connection_to_use=None):
    if isinstance(query, sqlalchemy.sql.expression.Executable):
        executable = query
    else:
        executable = sqlalchemy.select(query)
    return execute_statement(engine, executable, connection_to_use=connection_to_use).fetchall()


# TODO refactor to use @functools.total_ordering
class OrderByIds:
    """
    A mixin for ordering based on ids; useful at least for type enums in testing.
    """

    id: str  # noqa: NT001

    def __ge__(self, other):
        if self._ordering_supported(other):
            return self.id >= other.id
        return NotImplemented

    def __gt__(self, other):
        if self._ordering_supported(other):
            return self.id > other.id
        return NotImplemented

    def __le__(self, other):
        if self._ordering_supported(other):
            return self.id <= other.id
        return NotImplemented

    def __lt__(self, other):
        if self._ordering_supported(other):
            return self.id < other.id
        return NotImplemented

    def _ordering_supported(self, other):
        return hasattr(other, 'id')


def get_module_members_that_satisfy(module, predicate):
    """
    Looks at the members of the provided module and filters them using the provided predicate.

    Currently used to automatically collect all concrete subclasses of some abstract superclass
    found as top-level members of a module.
    """
    all_members_in_defining_module = inspect.getmembers(module)
    return set(
        member
        for _, member in all_members_in_defining_module
        if predicate(member)
    )
