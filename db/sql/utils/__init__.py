"""
These are SQL functions which are used in multiple modules.

- They shouldn't import anything not in this file.
- They should not depend on DB state (that would be D3L).
"""

import os
from os.path import join

from db.sql import msar

FILE_DIR = os.path.abspath(os.path.dirname(__file__))


def utils_path(filename):
    return os.path.join(FILE_DIR, filename)


mathesar_system_schemas = msar.MathesarFunction(
    dependencies=[],
    name="mathesar_system_schemas",
    code_path=utils_path("mathesar_system_schemas.sql"),
)


get_interval_fields = msar.MathesarFunction(
    dependencies=[],
    name="get_interval_fields",
    code_path=utils_path("get_interval_fields.sql"),
)
