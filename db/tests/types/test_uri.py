from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text, select, func, Table, MetaData, Column
from sqlalchemy.exc import IntegrityError
from db.engine import _add_custom_types_to_engine
from db.tests.types import fixtures
from db.types import uri
from db.utils import execute_query
from db.functions.base import ColumnName, Literal
from db.functions.operations.apply import apply_db_function_as_filter


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
uris_table_obj = fixtures.uris_table_obj
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
    ),
    # Tricky example from the RFC
    (
        "ftp://cnn.example.com&story=breaking_news@10.0.0.1/top_story.htm",
        {
            "scheme": "ftp",
            "authority": "cnn.example.com&story=breaking_news@10.0.0.1",
            "path": "/top_story.htm",
            "query": None,
            "fragment": None,
        },
    ),
    (
        "http://www.ics.uci.edu/pub/ietf/uri/#Related",
        {
            "scheme": "http",
            "authority": "www.ics.uci.edu",
            "path": "/pub/ietf/uri/",
            "query": None,
            "fragment": "Related",
        }

    ),
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


def test_uri_type_column_creation(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("uris", uri.URI),
        )
        test_table.create()


def test_uri_type_column_reflection(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("uris", uri.URI),
        )
        test_table.create()

    _add_custom_types_to_engine(engine)
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = uri.URI
    actual_cls = reflect_table.columns["uris"].type.__class__
    assert actual_cls == expect_cls


@pytest.mark.parametrize("test_uri", [tup[0] for tup in RFC_3986_EXAMPLES])
def test_uri_type_domain_passes_correct_uris(engine_email_type, test_uri):
    engine, _ = engine_email_type
    with engine.begin() as conn:
        res = conn.execute(text(f"SELECT '{test_uri}'::{uri.DB_TYPE};"))
    assert res.fetchone()[0] == test_uri


def test_uri_type_domain_accepts_uppercase(engine_email_type):
    engine, _ = engine_email_type
    test_uri = "https://centerofci.org"
    with engine.begin() as conn:
        res = conn.execute(text(f"SELECT '{test_uri}'::{uri.DB_TYPE.upper()};"))
    assert res.fetchone()[0] == test_uri


bad_uris = [
    "abcde",
    "://3/4",
    "/asdf",
]


@pytest.mark.parametrize("test_str", bad_uris)
def test_uri_type_domain_rejects_malformed_uris(engine_email_type, test_str):
    engine, _ = engine_email_type
    with pytest.raises(IntegrityError) as e:
        with engine.begin() as conn:
            conn.execute(text(f"SELECT '{test_str}'::{uri.DB_TYPE}"))
        assert type(e.orig) == CheckViolation


@pytest.mark.parametrize("main_db_function,literal_param,expected_count", [
    (uri.URIAuthorityContains, "soundcloud", 4),
    (uri.URIAuthorityContains, "http", 0),
    (uri.URISchemeEquals, "ftp", 2),
    (uri.Contains, ".com/31421017", 1),
])
def test_uri_db_functions(uris_table_obj, main_db_function, literal_param, expected_count):
    table, engine = uris_table_obj
    selectable = table.select()
    uris_column_name = "uri"
    db_function = main_db_function([
        ColumnName([uris_column_name]),
        Literal([literal_param]),
    ])
    query = apply_db_function_as_filter(selectable, db_function)
    record_list = execute_query(engine, query)
    assert len(record_list) == expected_count
