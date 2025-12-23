"""
D3L: Data Definition Description Language

D3L functions are those that amount to DQL operations on metadata. That
is, they query for metadata about database objects. An example is "list
the tables in `my_database`". Another is "List the columns in `mytable`
and their types".  Hopefully, most of these functions will already have
been removed during previous phases, but there are some which actually
pack API calls (e.g., to list the schemas in a database).

Can import:

- utils

Cannot import:

- ddl
- dml
- dql
"""
import os

from db.sql import msar, utils

FILE_DIR = os.path.abspath(os.path.dirname(__file__))


def d3l_path(filename):
    return os.path.join(FILE_DIR, filename)


get_object_counts = msar.MathesarFunction(
    dependencies=[utils.mathesar_system_schemas],
    name="get_object_counts",
    code_path=d3l_path("get_object_counts.sql"),
)

get_type_options = msar.MathesarFunction(
    dependencies=[utils.get_interval_fields],
    name="get_type_options",
    code_path=d3l_path("get_type_options.sql"),
)
