from time import time

from sqlalchemy import select

from db import constants
from db.columns.base import MathesarColumn
from db.connection import exec_msar_func
from db.schemas.operations.create import create_schema_if_not_exists_via_sql_alchemy
from db.tables.operations.create import CreateTableAs
from db.tables.operations.select import reflect_table
from db.types.operations.convert import get_db_type_enum_from_class
from db.metadata import get_empty_metadata


def infer_table_column_data_types(conn, table_oid):
    """
    Infer the best type for each column in the table.

    Currently we only suggest different types for columns which originate
    as type `text`.

    Args:
        tab_id: The OID of the table whose columns we're inferring types for.

    The response JSON will have attnum keys, and values will be the
    result of `format_type` for the inferred type of each column.
    Restricted to columns to which the user has access.
    """
    return exec_msar_func(
        conn, 'infer_table_column_data_types', table_oid
    ).fetchone()[0]
