import pytest
from sqlalchemy import text, select, func
from db.tests.types import fixtures


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


RFC_3986_EXAMPLES = [
    (
        "ftp://ftp.is.co.za/rfc/rfc1808.txt",
        {
            "scheme": "ftp",
            "authority": "ftp.is.co.za",
            "path": "/rfc/rfc1808.txt",
            "query": None,
            "fragment": None,
        },
    ),
    (
        "http://www.ietf.org/rfc/rfc2396.txt",
        {
            "scheme": "http",
            "authority": "www.ietf.org",
            "path": "/rfc/rfc2396.txt",
            "query": None,
            "fragment": None,

        },
    ),
    (
        "ldap://[2001:db8::7]/c=GB?objectClass?one",
        {
            "scheme": "ldap",
            "authority": "[2001:db8::7]",
            "path": "/c=GB",
            "query": "objectClass?one",
            "fragment": None,

        },
    ),
    (
        "mailto:John.Doe@example.com",
        {
            "scheme": "mailto",
            "authority": None,
            "path": "John.Doe@example.com",
            "query": None,
            "fragment": None,

        },

    ),
    (
        "news:comp.infosystems.www.servers.unix",
        {
            "scheme": "news",
            "authority": None,
            "path": "comp.infosystems.www.servers.unix",
            "query": None,
            "fragment": None,
        },
    ),
    (
        "tel:+1-816-555-1212",
        {
            "scheme": "tel",
            "authority": None,
            "path": "+1-816-555-1212",
            "query": None,
            "fragment": None,
        },
    ),
    (
        "telnet://192.0.2.16:80/",
        {
            "scheme": "telnet",
            "authority": "192.0.2.16:80",
            "path": "/",
            "query": None,
            "fragment": None,
        },
    ),
    (
        "urn:oasis:names:specification:docbook:dtd:xml:4.1.2",
        {
            "scheme": "urn",
            "authority": None,
            "path": "oasis:names:specification:docbook:dtd:xml:4.1.2",
            "query": None,
            "fragment": None,
        },
    )
]

FUNC_WRAPPERS = [
    ("scheme", func.uri_scheme),
    ("authority", func.uri_authority),
    ("path", func.uri_path),
    ("query", func.uri_query),
    ("fragment", func.uri_fragment),
]


@pytest.mark.parametrize("test_uri,part_dict", RFC_3986_EXAMPLES)
@pytest.mark.parametrize("part,wrapper", FUNC_WRAPPERS)
def test_uri_func_wrapper(engine_email_type, test_uri, part_dict, part, wrapper):
    engine, _ = engine_email_type
    sel = select(wrapper(text(f"'{test_uri}'")))
    with engine.begin() as conn:
        result = conn.execute(sel).fetchone()[0]
    assert result == part_dict[part]
