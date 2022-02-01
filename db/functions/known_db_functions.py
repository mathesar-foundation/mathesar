"""
Exports the known_db_functions variable, which describes what `DBFunction`s the library is aware
of. Note, that a `DBFunction` might be in this collection, but not be supported by a given
database.

Contains a private collection (`_db_functions_in_other_modules`) of `DBFunction` subclasses
declared outside the base module.

These variables were broken off into a discrete module to avoid circular imports.
"""

from db.types import uri

from db.functions.base import db_functions_in_base_module


_db_functions_in_other_modules = tuple([
    uri.ExtractURIAuthority,
])


known_db_functions = db_functions_in_base_module + _db_functions_in_other_modules
