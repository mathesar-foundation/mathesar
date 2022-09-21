from enum import Enum
import os
from sqlalchemy import text, Table, Column, String, MetaData
from sqlalchemy.dialects.postgresql import TEXT
from sqlalchemy.types import UserDefinedType

from db.functions import hints
from db.functions.base import DBFunction, Contains, sa_call_sql_function, Equal
from db.functions.packed import DBFunctionPacked

from db.types.base import MathesarCustomType, PostgresType, get_qualified_name, get_ma_qualified_schema

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


class URI(UserDefinedType):
    def get_col_spec(self, **_):
        # This results in the type name being upper case when viewed.
        # Actual usage in the DB is case-insensitive.
        return DB_TYPE.upper()


def install(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {DB_TYPE};
    """

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

    with engine.begin() as conn:
        conn.execute(text(drop_domain_query))
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
        conn.execute(text(create_domain_query))
        conn.commit()


def install_tld_lookup_table(engine):
    tlds_table = Table(
        TLDS_TABLE_NAME,
        MetaData(bind=engine),
        Column("tld", String, primary_key=True),
        schema=get_ma_qualified_schema(),
    )
    tlds_table.create()
    with engine.begin() as conn, open(TLDS_PATH) as f:
        conn.execute(
            tlds_table.insert(),
            [{"tld": tld.strip().lower()} for tld in f if tld[:2] != "# "],
        )


class ExtractURIAuthority(DBFunction):
    id = 'extract_uri_authority'
    name = 'extract URI authority'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.uri),
    ])
    depends_on = tuple([URIFunction.AUTHORITY])

    @staticmethod
    def to_sa_expression(uri):
        return sa_call_sql_function(URIFunction.AUTHORITY.value, uri, return_type=TEXT)


class ExtractURIScheme(DBFunction):
    id = 'extract_uri_scheme'
    name = 'extract URI scheme'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.uri),
    ])
    depends_on = tuple([URIFunction.SCHEME])

    @staticmethod
    def to_sa_expression(uri):
        return sa_call_sql_function(URIFunction.SCHEME.value, uri, return_type=TEXT)


class URIAuthorityContains(DBFunctionPacked):
    id = 'uri_authority_contains'
    name = 'URI authority contains'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.uri),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])
    depends_on = tuple([URIFunction.AUTHORITY])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Contains([
            ExtractURIAuthority([param0]),
            param1,
        ])


class URISchemeEquals(DBFunctionPacked):
    id = 'uri_scheme_equals'
    name = 'URI scheme is'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.uri),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])
    depends_on = tuple([URIFunction.SCHEME])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Equal([
            ExtractURIScheme([param0]),
            param1,
        ])
