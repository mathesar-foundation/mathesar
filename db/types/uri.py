from enum import Enum
import os
from sqlalchemy import text, Text, Table, Column, String, MetaData
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.types import UserDefinedType

from db.functions import hints
from db.functions.base import DBFunction, Contains, sa_call_sql_function, Equal
from db.functions.packed import DBFunctionPacked

from db.types import base

URI_STR = base.MathesarCustomType.URI.value
DB_TYPE = base.get_qualified_name(URI_STR)

TLDS_PATH = os.path.join(
    os.path.join(os.path.abspath(os.path.dirname(__file__)), "resources"),
    "tlds.txt"
)

TLDS_TABLE_NAME = "top_level_domains"
QUALIFIED_TLDS = base.get_qualified_name(TLDS_TABLE_NAME)


class URIFunction(Enum):
    PARTS = URI_STR + "_parts"
    SCHEME = URI_STR + "_scheme"
    AUTHORITY = URI_STR + "_authority"
    PATH = URI_STR + "_path"
    QUERY = URI_STR + "_query"
    FRAGMENT = URI_STR + "_fragment"


QualifiedURIFunction = Enum(
    "QualifiedURIFunction",
    {
        func_name.name: base.get_qualified_name(func_name.value)
        for func_name in URIFunction
    }
)


# This regex and the use of it are based on the one given in RFC 3986.
URI_REGEX_STR = r"'^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?'"


class URI(UserDefinedType):
    def get_col_spec(self, **_):
        # This results in the type name being upper case when viewed.
        # Actual usage in the DB is case-insensitive.
        return DB_TYPE.upper()


# This function lets us avoid having to define repetitive classes for
# adding custom SQL functions to SQLAlchemy
def build_generic_function_def_class(name):
    class_dict = {
        "type": Text,
        "name": quoted_name(QualifiedURIFunction[name].value, False),
        "identifier": URIFunction[name].value
    }
    return type(class_dict["identifier"], (GenericFunction,), class_dict)


# We need to add these classes to the globals() dict so they get picked
# up by SQLAlchemy
globals().update(
    {f.name: build_generic_function_def_class(f.name) for f in URIFunction}
)


def install(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {DB_TYPE};
    """

    create_uri_parts_query = f"""
    CREATE OR REPLACE FUNCTION {QualifiedURIFunction.PARTS.value}({base.PostgresType.TEXT.value})
    RETURNS {base.PostgresType.TEXT.value}[] AS $$
        SELECT regexp_match($1, {URI_REGEX_STR});
    $$
    LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
    """
    uri_parts_map = {
        QualifiedURIFunction.SCHEME.value: 2,
        QualifiedURIFunction.AUTHORITY.value: 4,
        QualifiedURIFunction.PATH.value: 5,
        QualifiedURIFunction.QUERY.value: 7,
        QualifiedURIFunction.FRAGMENT.value: 9,
    }

    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS text CHECK (
        (value IS NULL) OR ({QualifiedURIFunction.SCHEME.value}(value) IS NOT NULL
        AND {QualifiedURIFunction.PATH.value}(value) IS NOT NULL)
    );
    """

    with engine.begin() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_uri_parts_query))
        for part, index in uri_parts_map.items():
            create_uri_part_getter_query = f"""
            CREATE OR REPLACE FUNCTION {part}({base.PostgresType.TEXT.value})
            RETURNS {base.PostgresType.TEXT.value} AS $$
                SELECT ({QualifiedURIFunction.PARTS.value}($1))[{index}];
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
        schema=base.preparer.quote_schema(base.SCHEMA)
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
        return sa_call_sql_function(URIFunction.AUTHORITY.value, uri)


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
        return sa_call_sql_function(URIFunction.SCHEME.value, uri)


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
