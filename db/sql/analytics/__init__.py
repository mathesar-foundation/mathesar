"""
These are SQL functions to get analytics data about the DB setup.
"""
import os

from db.sql import msar, utils

FILE_DIR = os.path.abspath(os.path.dirname(__file__))

get_object_counts = msar.MathesarFunction(
    dependencies=[utils.mathesar_system_schemas],
    name="get_object_counts",
    code_path=os.path.join(FILE_DIR, 'get_object_counts.sql')
)
