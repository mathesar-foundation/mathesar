from db.records import exceptions
from sqlalchemy.exc import ProgrammingError
from psycopg2.errors import UndefinedFunction
import sqlalchemy


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
