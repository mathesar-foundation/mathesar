from enum import Enum
import os

from sqlalchemy import TEXT
from sqlalchemy.types import UserDefinedType
from psycopg.errors import DuplicateTable
from psycopg import sql

from db.types.base import MathesarCustomType
from db.types.custom.underlying_type import HasUnderlyingType

DB_TYPE = MathesarCustomType.URI.id

TLDS_PATH = os.path.join(
    os.path.join(os.path.abspath(os.path.dirname(__file__)), "resources"),
    "tlds.txt"
)


class URIFunction(Enum):
    PARTS = DB_TYPE + "_parts"
    SCHEME = DB_TYPE + "_scheme"
    AUTHORITY = DB_TYPE + "_authority"
    PATH = DB_TYPE + "_path"
    QUERY = DB_TYPE + "_query"
    FRAGMENT = DB_TYPE + "_fragment"


class URI(UserDefinedType, HasUnderlyingType):
    underlying_type = TEXT

    def get_col_spec(self, **_):
        # This results in the type name being upper case when viewed.
        # Actual usage in the DB is case-insensitive.
        return DB_TYPE.upper()


# TODO move this to 40_msar_types.sql.
def install_tld_lookup_table(conn):
    try:
        create_tlds_table_sql = sql.SQL("CREATE TABLE mathesar_types.top_level_domains (tld text PRIMARY KEY)")
        copy_tld_sql = sql.SQL("COPY mathesar_types.top_level_domains(tld) FROM STDIN")

        with open(TLDS_PATH) as f:
            tld_insert = [(tld.strip().lower()) for tld in f if tld[:2] != "# "]
            data_buffer = "\n".join(tld_insert).encode('utf-8')
        with conn.transaction():
            conn.execute(create_tlds_table_sql)
            with conn.cursor().copy(copy_tld_sql) as copy:
                copy.write(data_buffer)
    except DuplicateTable:
        pass
