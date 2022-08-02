"""
Exports the known_db_functions variable, which describes what `DBFunction` concrete subclasses the
library is aware of. Note, that a `DBFunction` might be in this collection, but not be
supported by a given database.

These variables were broken off into a discrete module to avoid circular imports.
"""

import inspect

from db.utils import get_module_members_that_satisfy

import db.functions.base
import db.functions.packed
import db.types.custom.datetime
import db.types.custom.email
import db.types.custom.uri

from db.functions.base import DBFunction


def _is_concrete_db_function_subclass(member):
    return (
        inspect.isclass(member)
        and issubclass(member, DBFunction)
        and not inspect.isabstract(member)
    )


_modules_to_search_in = tuple([
    db.functions.base,
    db.functions.packed,
    db.types.custom.datetime,
    db.types.custom.email,
    db.types.custom.uri,
])


known_db_functions = tuple(
    set.union(*[
        get_module_members_that_satisfy(
            module,
            _is_concrete_db_function_subclass
        )
        for module in _modules_to_search_in
    ])
)
