from enum import Enum
import os
from sqlalchemy import text, Table, Column, String, MetaData, TEXT
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.types import UserDefinedType
from psycopg2.errors import DuplicateTable

from db.types.base import MathesarCustomType, PostgresType, get_qualified_name, get_ma_qualified_schema
from db.types.custom.underlying_type import HasUnderlyingType
from db.utils import ignore_duplicate_wrapper

DB_TYPE = MathesarCustomType.URI.id

TLDS_PATH = os.path.join(
    os.path.join(os.path.abspath(os.path.dirname(__file__)), "resources"),
    "tlds.txt"
)

TLDS_TABLE_NAME = "top_level_domains"
QUALIFIED_TLDS = get_qualified_name(TLDS_TABLE_NAME)


class URIFunction(Enum):
    PARTS = DB_TYPE + "_parts"
    SCHEME = DB_TYPE + "_scheme"
    AUTHORITY = DB_TYPE + "_authority"
    PATH = DB_TYPE + "_path"
    QUERY = DB_TYPE + "_query"
    FRAGMENT = DB_TYPE + "_fragment"


# This regex and the use of it are based on the one given in RFC 3986.
URI_REGEX_STR = r"'^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?'"


class URI(UserDefinedType, HasUnderlyingType):
    underlying_type = TEXT

    def get_col_spec(self, **_):
        # This results in the type name being upper case when viewed.
        # Actual usage in the DB is case-insensitive.
        return DB_TYPE.upper()


def install(engine):
    create_uri_parts_query = f"""
    CREATE OR REPLACE FUNCTION {URIFunction.PARTS.value}({PostgresType.TEXT.value})
    RETURNS {PostgresType.TEXT.value}[] AS $$
        SELECT regexp_match($1, {URI_REGEX_STR});
    $$
    LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
    """
    uri_parts_map = {
        URIFunction.SCHEME.value: 2,
        URIFunction.AUTHORITY.value: 4,
        URIFunction.PATH.value: 5,
        URIFunction.QUERY.value: 7,
        URIFunction.FRAGMENT.value: 9,
    }

    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS text CHECK (
        (value IS NULL) OR ({URIFunction.SCHEME.value}(value) IS NOT NULL
        AND {URIFunction.PATH.value}(value) IS NOT NULL)
    );
    """
    create_if_not_exist_domain_query = ignore_duplicate_wrapper(create_domain_query)

    with engine.begin() as conn:
        conn.execute(text(create_uri_parts_query))
        for part, index in uri_parts_map.items():
            create_uri_part_getter_query = f"""
            CREATE OR REPLACE FUNCTION {part}({PostgresType.TEXT.value})
            RETURNS {PostgresType.TEXT.value} AS $$
                SELECT ({URIFunction.PARTS.value}($1))[{index}];
            $$
            LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
            """
            conn.execute(text(create_uri_part_getter_query))
        conn.execute(text(create_if_not_exist_domain_query))
        conn.commit()


def install_tld_lookup_table(engine):
    tlds_table = Table(
        TLDS_TABLE_NAME,
        MetaData(bind=engine),
        Column("tld", String, primary_key=True),
        schema=get_ma_qualified_schema(),
    )
    try:
        tlds_table.create()
        with engine.begin() as conn, open(TLDS_PATH) as f:
            conn.execute(
                tlds_table.insert(),
                [{"tld": tld.strip().lower()} for tld in f if tld[:2] != "# "],
            )
    except ProgrammingError as e:
        if e.orig == DuplicateTable:
            pass
