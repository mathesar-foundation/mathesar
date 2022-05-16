from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text, select, Table, MetaData, Column
from sqlalchemy.exc import IntegrityError
from db.types.custom import uri
from db.utils import execute_query
from db.functions.base import ColumnName, Literal, sa_call_sql_function
from db.functions.operations.apply import apply_db_function_as_filter


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
    ("scheme", uri.URIFunction.SCHEME),
    ("authority", uri.URIFunction.AUTHORITY),
    ("path", uri.URIFunction.PATH),
    ("query", uri.URIFunction.QUERY),
    ("fragment", uri.URIFunction.FRAGMENT),
]


@pytest.mark.parametrize("test_uri,part_dict", RFC_3986_EXAMPLES)
@pytest.mark.parametrize("part,uri_function", FUNC_WRAPPERS)
def test_uri_func_wrapper(engine_with_schema, test_uri, part_dict, part, uri_function):
    engine, _ = engine_with_schema
    uri_function_name = uri_function.value
    sel = select(sa_call_sql_function(uri_function_name, text(f"'{test_uri}'")))
    with engine.begin() as conn:
        result = conn.execute(sel).fetchone()[0]
    assert result == part_dict[part]


def test_uri_type_column_creation(engine_with_schema):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("uris", uri.URI),
        )
        test_table.create()


test_data = ('https://centerofci.org', None)


@pytest.mark.parametrize("data", test_data)
def test_uri_type_set_data(engine_with_schema, data):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("uris", uri.URI),
        )
        test_table.create()
        conn.execute(test_table.insert(values=(data,)))


def test_uri_type_column_reflection(engine_with_schema):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("uris", uri.URI),
        )
        test_table.create()

    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = uri.URI
    actual_cls = reflect_table.columns["uris"].type.__class__
    assert actual_cls == expect_cls


@pytest.mark.parametrize("test_uri", [tup[0] for tup in RFC_3986_EXAMPLES])
def test_uri_type_domain_passes_correct_uris(engine_with_schema, test_uri):
    engine, _ = engine_with_schema
    with engine.begin() as conn:
        res = conn.execute(text(f"SELECT '{test_uri}'::{uri.DB_TYPE};"))
    assert res.fetchone()[0] == test_uri


def test_uri_type_domain_accepts_uppercase(engine_with_schema):
    engine, _ = engine_with_schema
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
def test_uri_type_domain_rejects_malformed_uris(engine_with_schema, test_str):
    engine, _ = engine_with_schema
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
