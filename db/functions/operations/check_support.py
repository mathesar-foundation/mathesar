from enum import Enum

from sqlalchemy import select, MetaData, join, literal

from db.functions.known_db_functions import known_db_functions
from db.utils import get_pg_catalog_table


def get_supported_db_functions(engine):
    functions_on_database = _get_functions_defined_on_database(engine)
    supported_db_functions = tuple(
        db_function
        for db_function in known_db_functions
        if _are_db_function_dependencies_satisfied(
            db_function,
            functions_on_database
        )
    )
    return supported_db_functions


# TODO consider caching
def _get_functions_defined_on_database(engine):
    """
    Constructs and executes a query that returns the set of schema-
    qualified function names on the database. E.g.
    `{'mathesar_types.uri_scheme', ..., ...}`.
    """
    metadata = MetaData()
    pg_proc = get_pg_catalog_table('pg_proc', engine, metadata=metadata)
    pg_namespace = get_pg_catalog_table('pg_namespace', engine, metadata=metadata)
    join_statement = join(pg_proc, pg_namespace, pg_proc.c.pronamespace == pg_namespace.c.oid)
    select_statement = (
        select(pg_namespace.c.nspname + literal('.') + pg_proc.c.proname)
        .select_from(join_statement)
    )
    with engine.connect() as connection:
        return frozenset(
            qualified_function_name
            for qualified_function_name,
            in connection.execute(select_statement)
        )


def _are_db_function_dependencies_satisfied(db_function, functions_on_database):
    no_dependencies = not db_function.depends_on
    return (
        no_dependencies
        or all(
            _is_dependency_function_in(dependency_function, functions_on_database)
            for dependency_function in db_function.depends_on
        )
    )


def _is_dependency_function_in(dependency_function, functions_on_database):
    """
    A dependency function may be specified as a string or as an enum instance, whose .value
    attribute is the string name of the function.

    An enum instance is accepted since some SQL function names are stored in enums (e.g. URI
    functions).
    """
    def _get_function_name(dependency_function):
        if isinstance(dependency_function, Enum):
            return dependency_function.value
        else:
            return dependency_function
    return _get_function_name(dependency_function) in functions_on_database
