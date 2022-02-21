"""
Exports the known_db_functions variable, which describes what `DBFunction`s the library is aware
of. Note, that a `DBFunction` might be in this collection, but not be supported by a given
database.

Contains a private collection (`_db_functions_in_other_modules`) of `DBFunction` subclasses
declared outside the base module.

These variables were broken off into a discrete module to avoid circular imports.
"""

import inspect

import db.functions.base
import db.functions.redundant

from db.functions.base import DBFunction

from db.types import uri


def _get_module_members_that_satisfy(module, predicate):
    """
    Looks at the members of the provided module and filters them using the provided predicate.

    In this context, it (together with the appropriate predicate) is used to automatically collect
    all DBFunction subclasses found as top-level members of a module.
    """
    all_members_in_defining_module = inspect.getmembers(module)
    return tuple(
        member
        for _, member in all_members_in_defining_module
        if predicate(member)
    )


def _is_concrete_db_function_subclass(member):
    return (
        inspect.isclass(member)
        and issubclass(member, DBFunction)
        and not inspect.isabstract(member)
    )


_db_functions_in_base_module = (
    _get_module_members_that_satisfy(
        db.functions.base,
        _is_concrete_db_function_subclass
    )
)


_db_functions_in_redundant_module = (
    _get_module_members_that_satisfy(
        db.functions.redundant,
        _is_concrete_db_function_subclass
    )
)


_db_functions_in_other_modules = tuple([
    uri.ExtractURIAuthority,
])


known_db_functions = (
    _db_functions_in_base_module
    + _db_functions_in_redundant_module
    + _db_functions_in_other_modules
)
