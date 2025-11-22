# tests/test_dbconfig.py
import pytest
import psycopg
from django.conf import settings

from config.database_config import (
    DBConfig,
    PostgresConfig,
    parse_port,
    get_internal_database_config,
    POSTGRES_ENGINE,
)


class DummyConfig(DBConfig):
    """A minimal concrete subclass of DBConfig for testing from_django_dict."""
    @classmethod
    def from_connection_string(cls, url: str) -> "DummyConfig":
        return cls(dbname="dummy", engine="dummy_engine")


def test_parse_port_none_and_empty():
    assert parse_port(None) is None
    assert parse_port("") is None


def test_parse_port_valid_and_int():
    assert parse_port("0") == 0
    assert parse_port("5432") == 5432
    assert parse_port(1234) == 1234


def test_parse_port_invalid_raises():
    with pytest.raises(ValueError) as exc:
        parse_port("not-an-int")
    assert "Invalid PORT value" in str(exc.value)


@pytest.mark.parametrize("cfg, missing", [
    ({}, {"ENGINE", "NAME"}),
    ({"ENGINE": POSTGRES_ENGINE}, {"NAME"}),
    ({"NAME": "foo"}, {"ENGINE"}),
])
def test_dbconfig_from_django_dict_missing_required(cfg, missing):
    with pytest.raises(ValueError) as exc:
        DummyConfig.from_django_dict(cfg)
    assert str(missing) in str(exc.value)


def test_dbconfig_from_django_dict_and_parse_to_django_dict():
    raw = {
        "ENGINE": "my.engine",
        "NAME": "dbname",
        "HOST": "h.example.com",
        "PORT": "6543",
        "USER": "role1",
        "PASSWORD": "secret!",
        "OPTIONS": {"opt1": 1, "opt2": "two"},
        "ATOMIC_REQUESTS": True,
        "AUTOCOMMIT": False,
        "CONN_MAX_AGE": 42,
        "CONN_HEALTH_CHECKS": True,
        "DISABLE_SERVER_SIDE_CURSORS": True,
        "TIME_ZONE": "UTC",
    }
    cfg = DummyConfig.from_django_dict(raw)
    # check attribute types and values
    assert cfg.engine == raw["ENGINE"]
    assert cfg.dbname == raw["NAME"]
    assert cfg.host == raw["HOST"]
    assert cfg.port == 6543
    assert cfg.role == raw["USER"]
    assert cfg.password == raw["PASSWORD"]
    assert cfg.options == raw["OPTIONS"]
    assert cfg.atomic_requests is True
    assert cfg.autocommit is False
    assert cfg.conn_max_age == 42
    assert cfg.conn_health_checks is True
    assert cfg.disable_server_side_cursors is True
    assert cfg.time_zone == "UTC"

    out = cfg.to_django_dict()
    assert out["ENGINE"] == raw["ENGINE"]
    assert out["NAME"] == raw["NAME"]
    assert out["HOST"] == raw["HOST"]
    assert out["PORT"] == raw["PORT"]
    assert out["USER"] == raw["USER"]
    assert out["PASSWORD"] == raw["PASSWORD"]
    assert out["ATOMIC_REQUESTS"] is True
    assert out["AUTOCOMMIT"] is False
    assert out["CONN_MAX_AGE"] == 42
    assert out["CONN_HEALTH_CHECKS"] is True
    assert out["DISABLE_SERVER_SIDE_CURSORS"] is True
    assert out["TIME_ZONE"] == "UTC"
    assert out["OPTIONS"] == raw["OPTIONS"]


def test_to_django_dict_minimal():
    cfg = DummyConfig(dbname="db", engine="eng")
    d = cfg.to_django_dict()
    assert d == {
        "ENGINE": "eng",
        "NAME": "db",
        "CONN_HEALTH_CHECKS": False,
        "CONN_MAX_AGE": 0,
        "DISABLE_SERVER_SIDE_CURSORS": False
    }


def test_postgresql_config_conn_string():
    fakeconn = "postgresql://usr:pw@h1:7777/db1?sslmode=require"
    pc = PostgresConfig.from_connection_string(fakeconn)

    assert pc.engine == POSTGRES_ENGINE
    assert pc.dbname == "db1"
    assert pc.host == "h1"
    assert pc.port == 7777
    assert pc.role == "usr"
    assert pc.password == "pw"
    assert pc.sslmode == "require"
    # sslmode must also appear in options
    assert pc.options["sslmode"] == "require"

    # throw when dbname is not provided
    fakeconn = "postgresql://h1:7777/"
    with pytest.raises(ValueError):
        PostgresConfig.from_connection_string(fakeconn)

    # throw when invalid conn is passed
    with pytest.raises(psycopg.ProgrammingError):
        PostgresConfig.from_connection_string("invalid")


def test_postgresconfig_from_django_dict_handles_sslmode():
    raw_opts = {"sslmode": "require", "foo": "bar"}
    django_cfg = {
        "ENGINE": POSTGRES_ENGINE,
        "NAME": "mydb",
        "OPTIONS": raw_opts.copy(),
    }
    pc = PostgresConfig.from_django_dict(django_cfg)
    assert pc.sslmode == "require"
    assert pc.options == {"foo": "bar", "sslmode": "require"}

    out = pc.to_django_dict()
    assert out["OPTIONS"] == {"foo": "bar", "sslmode": "require"}


def test_get_internal_database_config_variations(monkeypatch):
    monkeypatch.setattr(settings, "DATABASES", {}, raising=False)
    with pytest.raises(KeyError):
        get_internal_database_config()

    # unsupported engine
    monkeypatch.setattr(settings, "DATABASES", {"default": {"ENGINE": "sqlite3"}}, raising=False)
    with pytest.raises(NotImplementedError):
        get_internal_database_config()

    # supported engine
    valid = {"default": {"ENGINE": POSTGRES_ENGINE, "NAME": "xyz", "OPTIONS": {}}}
    monkeypatch.setattr(settings, "DATABASES", valid, raising=False)
    cfg = get_internal_database_config()
    assert isinstance(cfg, PostgresConfig)
    assert cfg.dbname == "xyz"
