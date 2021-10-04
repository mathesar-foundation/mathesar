from enum import Enum
from sqlalchemy import text, Text
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.types import UserDefinedType

from db.types import base

URI = base.MathesarCustomType.URI.value
DB_TYPE = base.get_qualified_name(URI)

class URIFunction(Enum):
    PARTS = URI + "_parts"
    SCHEME = URI + "_scheme"
    AUTHORITY = URI + "_authority"
    PATH = URI + "_path"
    QUERY = URI + "_query"
    FRAGMENT = URI + "_fragment"


QualifiedURIFunction = Enum(
    "QualifiedURIFunction",
    {
        func_name.name: base.get_qualified_name(func_name.value)
        for func_name in URIFunction
    }
)


# This regex and the use of it are based on the one given in RFC 3986.
URI_REGEX_STR = r"'^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?'"


# This function lets us avoid having to define repetitive classes for
# adding custom SQL functions to SQLAlchemy
def build_genric_function_def_class(name):
    class_dict = {
        "type": Text,
        "name": quoted_name(QualifiedURIFunction[name].value, False),
        "identifier": URIFunction[name].value
    }
    return type(class_dict["identifier"], (GenericFunction,), class_dict)


# We need to add these classes to the globals() dict so they get picked
# up by SQLAlchemy
globals().update(
    {f.name: build_genric_function_def_class(f.name) for f in URIFunction}
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
        {QualifiedURIFunction.SCHEME.value}(value) IS NOT NULL
        AND {QualifiedURIFunction.PATH.value}(value) IS NOT NULL
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
