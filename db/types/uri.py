from db.types import base
from sqlalchemy import text

# These constants are in the order (roughly) in which they appear in a
# URI, rather than the usual lexicographical order.
URI = base.MathesarCustomType.URI.value
URI_PARTS = URI + "_parts"
URI_SCHEME = URI + "_scheme"
URI_AUTHORITY = URI + "_authority"
URI_PATH = URI + "_path"
URI_QUERY = URI + "_query"
URI_FRAGMENT = URI + "_fragment"

DB_TYPE = base.get_qualified_name(URI)
QUALIFIED_URI_PARTS = base.get_qualified_name(URI_PARTS)
QUALIFIED_URI_SCHEME = base.get_qualified_name(URI_SCHEME)
QUALIFIED_URI_AUTHORITY = base.get_qualified_name(URI_AUTHORITY)
QUALIFIED_URI_PATH = base.get_qualified_name(URI_PATH)
QUALIFIED_URI_QUERY = base.get_qualified_name(URI_QUERY)
QUALIFIED_URI_FRAGMENT = base.get_qualified_name(URI_FRAGMENT)


# This regex and the use of it are based on the one given in RFC 3986.
URI_REGEX_STR = r"'^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?'"


def install(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {DB_TYPE};
    """

    create_uri_parts_query = f"""
    CREATE OR REPLACE FUNCTION {QUALIFIED_URI_PARTS}({base.PostgresType.TEXT.value})
    RETURNS {base.PostgresType.TEXT.value}[] AS $$
        SELECT regexp_match($1, {URI_REGEX_STR});
    $$
    LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
    """
    uri_parts_map = {
        QUALIFIED_URI_SCHEME: 2,
        QUALIFIED_URI_AUTHORITY: 4,
        QUALIFIED_URI_PATH: 5,
        QUALIFIED_URI_QUERY: 7,
        QUALIFIED_URI_FRAGMENT: 9,
    }

    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS text CHECK (
        {QUALIFIED_URI_SCHEME}(value) IS NOT NULL
        AND {QUALIFIED_URI_PATH}(value) IS NOT NULL
    );
    """

    with engine.begin() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_uri_parts_query))
        for part, index in uri_parts_map.items():
            create_uri_part_getter_query = f"""
            CREATE OR REPLACE FUNCTION {part}({base.PostgresType.TEXT.value})
            RETURNS {base.PostgresType.TEXT.value} AS $$
                SELECT ({QUALIFIED_URI_PARTS}($1))[{index}];
            $$
            LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
            """
            conn.execute(text(create_uri_part_getter_query))
        conn.execute(text(create_domain_query))
        conn.commit()
