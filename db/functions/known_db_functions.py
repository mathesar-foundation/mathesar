"""
Exports the known_db_functions variable, which describes what `DBFunction` concrete subclasses the
library is aware of. Note, that a `DBFunction` might be in this collection, but not be
supported by a given database.

These variables were broken off into a discrete module to avoid circular imports.
"""

import inspect

import db.functions.base
import db.functions.packed
import db.types.custom.uri
import db.types.custom.email

from db.functions.base import DBFunction


def _get_module_members_that_satisfy(module, predicate):
    """
    Looks at the members of the provided module and filters them using the provided predicate.

    In this context, it (together with the appropriate predicate) is used to automatically collect
    all DBFunction subclasses found as top-level members of a module.
    """
    all_members_in_defining_module = inspect.getmembers(module)
    return set(
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


_modules_to_search_in = tuple([
    db.functions.base,
    db.functions.packed,
    db.types.custom.uri,
    db.types.custom.email,
])


known_db_functions = tuple(
    set.union(*[
        _get_module_members_that_satisfy(
            module,
            _is_concrete_db_function_subclass
        )
        for module in _modules_to_search_in
    ])
)
