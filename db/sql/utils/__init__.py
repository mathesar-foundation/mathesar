"""
These are SQL functions which are used in multiple modules.

- They shouldn't import anything not in this file.
- They should not depend on DB state (that would be D3L).
"""

import os

from db.sql import msar

FILE_DIR = os.path.abspath(os.path.dirname(__file__))


mathesar_system_schemas = msar.MathesarFunction(
    dependencies=[],
    name="mathesar_system_schemas",
    code_path=os.path.join(FILE_DIR, "mathesar_system_schemas.sql")
)
