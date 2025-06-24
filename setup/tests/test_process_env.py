import io
import sys
from contextlib import redirect_stdout, redirect_stderr

import pytest
import psycopg

from setup import process_env


EMPTY_ENV = "\n"

ENV_WITH_GOOD_PG_AND_KEY = """
SECRET_KEY="already-set"
POSTGRES_HOST=localhost
POSTGRES_USER=me
POSTGRES_DB=mydb
"""


class _Conn:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        pass


def _stub_connect_ok(**_):
    return _Conn()


def _stub_connect_error(**_):
    raise RuntimeError("runtime error")


# Tests

def test_parse_env():
    raw = "A=1\r\n" \
          "# comment\r\n" \
          "B = someval  \n" \
          "\n" \
          "C=\"val=3\"\n" \
          "\n"
    lines, env = process_env.parse_env(raw)

    assert len(lines) == 6
    assert len(env) == 3
    assert env["A"] == "1"
    assert env["B"] == "someval"
    assert env["C"] == "val=3"


def test_update_env_lines():
    original = [
        "REPLACED=old\n",
        "EXISTING=1\n"
    ]
    updates = {"REPLACED": "new", "NEW": "2"}
    updated = process_env.update_env_lines(original, updates)

    assert "REPLACED=\"new\"" in updated
    assert "NEW=\"2\"" in updated
    assert "EXISTING=1\n" in updated
    assert "\n\n" not in updated


def test_generate_secret_key():
    secret = process_env.generate_secret_key()

    allowed = set(process_env.string.ascii_letters + process_env.string.digits)
    assert len(secret) == 50
    assert set(secret) <= allowed


@pytest.mark.parametrize(
    "conn_string, expected_env_map",
    [
        (
            "postgres://super:password@localhost:5411/mydb",
            {
                "POSTGRES_HOST": "localhost",
                "POSTGRES_PORT": "5411",
                "POSTGRES_DB": "mydb",
                "POSTGRES_USER": "super",
                "POSTGRES_PASSWORD": "password",
            }
        ),
        (
            "user@localhost/db",
            {
                "POSTGRES_HOST": "localhost",
                "POSTGRES_PORT": "",
                "POSTGRES_DB": "db",
                "POSTGRES_USER": "user",
                "POSTGRES_PASSWORD": "",
            }
        ),
        (
            "postgresql://user@/dbname?host=/var/lib/postgresql",
            {
                "POSTGRES_HOST": "/var/lib/postgresql",
                "POSTGRES_PORT": "",
                "POSTGRES_DB": "dbname",
                "POSTGRES_USER": "user",
                "POSTGRES_PASSWORD": "",
            }
        ),
        (
            "postgres://user@%2Fvar%2Flib%2Fpostgresql/dbname",
            {
                "POSTGRES_HOST": "/var/lib/postgresql",
                "POSTGRES_PORT": "",
                "POSTGRES_DB": "dbname",
                "POSTGRES_USER": "user",
                "POSTGRES_PASSWORD": "",
            }
        ),
        (
            "postgresql://user:somepass@%2Fvar%2Flib%2Fpostgresql:5466/dbname",
            {
                "POSTGRES_HOST": "/var/lib/postgresql",
                "POSTGRES_PORT": "5466",
                "POSTGRES_DB": "dbname",
                "POSTGRES_USER": "user",
                "POSTGRES_PASSWORD": "somepass",
            }
        ),
        (
            "postgresql:///mydb?host=localhost&port=5433&user=someuser",
            {
                "POSTGRES_HOST": "localhost",
                "POSTGRES_PORT": "5433",
                "POSTGRES_DB": "mydb",
                "POSTGRES_USER": "someuser",
                "POSTGRES_PASSWORD": "",
            }
        ),
        (
            "/mydb?host=/var/run/postgresql&port=5433&user=someuser",
            {
                "POSTGRES_HOST": "/var/run/postgresql",
                "POSTGRES_PORT": "5433",
                "POSTGRES_DB": "mydb",
                "POSTGRES_USER": "someuser",
                "POSTGRES_PASSWORD": "",
            }
        ),
    ],
)
def test_construct_env_vars_from_connection_string(monkeypatch, conn_string, expected_env_map):
    monkeypatch.setattr(psycopg, "connect", _stub_connect_ok, raising=True)
    env_map = process_env.construct_env_vars_from_connection_string(conn_string)
    assert env_map == expected_env_map


@pytest.mark.parametrize(
    "conn_string, expected_msg",
    [
        ("", "Invalid: The connection string requires host, user, and dbname"),
        ("user/db", "Invalid: The connection string requires host, user, and dbname"),
        ("postgres://user/db", "Invalid: The connection string requires host, user, and dbname"),
        ("postgres://user@localhost", "Invalid: The connection string requires host, user, and dbname"),
        ("postg://missing", "Invalid: The connection string requires host, user, and dbname"),
    ],
)
def test_validate_pg_conn_string_error_paths(monkeypatch, conn_string, expected_msg):
    monkeypatch.setattr(psycopg, "connect", _stub_connect_ok, raising=True)
    with pytest.raises(SystemExit) as exc:
        process_env.construct_env_vars_from_connection_string(conn_string)
    assert expected_msg in str(exc.value)


# Integration tests for main()


def _run_main(stdin_text, argv, monkeypatch, connect_stub):
    """Run process_env.main() with patched stdin/stdout and patched connect."""
    monkeypatch.setattr(psycopg, "connect", connect_stub, raising=True)

    orig_stdin, orig_argv = sys.stdin, sys.argv
    sys.stdin = io.StringIO(stdin_text)
    sys.argv = ["process_env.py", *argv]

    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        try:
            process_env.main()
            code = 0
        except SystemExit as ex:
            print(ex)
            code = ex.code if isinstance(ex.code, int) else 1
    sys.stdin, sys.argv = orig_stdin, orig_argv
    return out.getvalue(), err.getvalue(), code


def test_main_existing_no_conn_string_provided_existing_env_is_good(monkeypatch):
    out, _err, code = _run_main(
        ENV_WITH_GOOD_PG_AND_KEY,
        argv=[],
        monkeypatch=monkeypatch,
        connect_stub=_stub_connect_ok,
    )
    assert code == 0
    # env vars should be unchanged
    assert 'already-set' in out
    assert 'POSTGRES_USER="me"\n' in out
    assert 'POSTGRES_HOST="localhost"\n' in out
    assert 'POSTGRES_PORT=""\n' in out
    assert 'POSTGRES_DB="mydb"\n' in out
    assert 'POSTGRES_PASSWORD=""\n' in out


def test_main_existing_no_conn_string_provided_existing_env_is_bad(monkeypatch):
    out, _err, code = _run_main(
        EMPTY_ENV,
        argv=[],
        monkeypatch=monkeypatch,
        connect_stub=_stub_connect_ok,
    )
    assert code != 0 and out == "Required PostgreSQL connection parameters are missing in the .env file and no connection string was provided.\n"


def test_main_generates_env_vars(monkeypatch):
    out, _err, code = _run_main(
        EMPTY_ENV,
        argv=["postgres://user:pass@localhost:5411/db"],
        monkeypatch=monkeypatch,
        connect_stub=_stub_connect_ok,
    )
    assert code == 0
    parsed = dict(line.split("=", 1) for line in out.splitlines() if "=" in line)
    assert len(parsed["SECRET_KEY"].strip('"')) == 50
    assert len(parsed) == 6
    assert 'POSTGRES_USER="user"\n' in out
    assert 'POSTGRES_HOST="localhost"\n' in out
    assert 'POSTGRES_PORT="5411"\n' in out
    assert 'POSTGRES_DB="db"\n' in out
    assert 'POSTGRES_PASSWORD="pass"\n' in out


def test_main_generates_replaces_existing_pg_env_vars(monkeypatch):
    out, _err, code = _run_main(
        ENV_WITH_GOOD_PG_AND_KEY,
        argv=["postgres://newuser:newpass@someserver:5444/newdb"],
        monkeypatch=monkeypatch,
        connect_stub=_stub_connect_ok,
    )
    assert code == 0
    parsed = dict(line.split("=", 1) for line in out.splitlines() if "=" in line)
    assert len(parsed) == 6
    assert 'already-set' in out
    assert 'POSTGRES_USER="newuser"\n' in out
    assert 'POSTGRES_HOST="someserver"\n' in out
    assert 'POSTGRES_PORT="5444"\n' in out
    assert 'POSTGRES_DB="newdb"\n' in out
    assert 'POSTGRES_PASSWORD="newpass"\n' in out


def test_main_error_conn_fail(monkeypatch):
    out, _err, code = _run_main(
        EMPTY_ENV,
        argv=["postgres://bad@host/db"],
        monkeypatch=monkeypatch,
        connect_stub=_stub_connect_error,
    )
    assert code != 0 and out == "Invalid: Unable to connect to the database. runtime error\n"
